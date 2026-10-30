import { readFile } from 'node:fs/promises'
import { STATUS_CODES } from 'node:http'
import { isIP } from 'node:net'
import path from 'node:path'
import type { Connect, Plugin, ViteDevServer } from 'vite'
import { WebSocketServer } from 'ws'
import type {
  BinbookConfig,
  CanvasConfig,
  DocsMeta,
  Dispose,
  RenderResult,
  Story,
  TreeNode,
} from '@bgunnarsson/binbook-types'
import { discoverStories } from './discover'
import { expandStories } from './expand'
import { buildTree } from './tree'
import { AdapterRegistry } from './registry'
import { renderStory } from './render'
import { resolveCanvasConfig } from './canvas-config'
import { checkForUpdate } from './update-check'

export interface ApiHandlers {
  stories(): Promise<{ tree: TreeNode[]; stories: Story[] }>
  render(body: { storyId: string; variant: string; args: Record<string, unknown> }): Promise<RenderResult>
  docs(body: { storyId: string }): Promise<DocsMeta>
  canvas(): CanvasConfig
  reload(): Promise<void>
}

export async function createApiHandlers(opts: { root: string; config: BinbookConfig }): Promise<ApiHandlers> {
  const registry = new AdapterRegistry(opts.config.adapters)
  let stories = await expandStories(registry, await discoverStories(opts.config, opts.root))

  return {
    async stories() {
      return { tree: buildTree(stories), stories }
    },
    async render({ storyId, variant, args }) {
      const story = stories.find((s) => s.id === storyId)
      if (!story) {
        throw new Error(`Unknown story ${storyId}`)
      }
      return renderStory(registry, story, variant, args ?? {}, opts.root, opts.config.decorators ?? [])
    },
    async docs({ storyId }) {
      const story = stories.find((s) => s.id === storyId)
      if (!story) {
        throw new Error(`Unknown story ${storyId}`)
      }
      const adapter = registry.forStory(story)
      return (await adapter.docs?.(story)) ?? {}
    },
    canvas() {
      return resolveCanvasConfig(opts.config)
    },
    async reload() {
      stories = await expandStories(registry, await discoverStories(opts.config, opts.root))
    },
  }
}

/**
 * JSON body reader for connect middleware.
 *
 * Generic rather than `any`: the caller names the shape it is about to hand to
 * a handler, so the assertion sits next to the route that knows it instead of
 * being baked into the reader for every route at once.
 */
function readJson<T>(req: Connect.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', (c) => {
      data += c
    })
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

/**
 * Gate for every `/api/*` route; returns the status to refuse with, if any.
 *
 * The viewer is the only browser client, and it sends same-origin GETs and
 * `application/json` POSTs. A page on another origin can still send a
 * `text/plain` POST without a preflight, and the routes run project code, so a
 * foreign `Origin`, the wrong method or a non-JSON body is refused before the
 * route runs. No `Origin` at all (curl, scripts) is not a browser request.
 *
 * Origin matching Host is not enough on its own: a DNS-rebound page controls
 * both, and Vite's own Host check runs after plugin middlewares. So the Host
 * must also be a loopback name or an IP, as Vite's default `allowedHosts` has it.
 */
export function rejectApiRequest(req: Connect.IncomingMessage, method: 'GET' | 'POST'): number | undefined {
  const { host, origin } = req.headers
  if (host !== undefined && !isLocalHost(host)) {
    return 403
  }
  if (origin !== undefined && originHost(origin) !== host) {
    return 403
  }
  if (req.method !== method) {
    return 405
  }
  const type = req.headers['content-type']?.split(';')[0].trim().toLowerCase()
  if (method === 'POST' && type !== 'application/json') {
    return 415
  }
  return undefined
}

function isLocalHost(host: string): boolean {
  let name: string
  try {
    name = new URL(`http://${host}`).hostname.replace(/^\[(.*)\]$/, '$1')
  } catch {
    return false
  }
  return name === 'localhost' || name.endsWith('.localhost') || isIP(name) !== 0
}

function originHost(origin: string): string | undefined {
  try {
    return new URL(origin).host
  } catch {
    return undefined
  }
}

function guard(method: 'GET' | 'POST', handle: Connect.NextHandleFunction): Connect.NextHandleFunction {
  return (req, res, next) => {
    const status = rejectApiRequest(req, method)
    if (status === undefined) {
      return handle(req, res, next)
    }
    res.statusCode = status
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({ error: STATUS_CODES[status] }))
  }
}

export function binbookServer(opts: { root: string; config: BinbookConfig }): Plugin {
  return {
    name: 'binbook-server',
    async configureServer(server: ViteDevServer) {
      const api = await createApiHandlers(opts)
      // Started now, answered whenever the viewer asks: one npm request per run.
      const update = checkForUpdate(opts.root)
      const wss = new WebSocketServer({ noServer: true })

      server.httpServer?.on('upgrade', (req, socket, head) => {
        if (req.url === '/__binbook_ws') {
          wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws))
        }
      })

      const pushReload = () => wss.clients.forEach((c) => c.readyState === 1 && c.send('reload'))

      // Watch story files + component files; re-discover + push reload.
      let disposers: Dispose[] = []

      const onChange = async () => {
        try {
          await api.reload()
          await subscribeWatchers()
          pushReload()
        } catch (err) {
          console.warn('[binbook] reload failed:', (err as Error).message)
        }
      }

      async function subscribeWatchers() {
        disposers.forEach((d) => d())
        disposers = []
        const list = (await api.stories()).stories
        const adapter = opts.config.adapters[0]
        for (const story of list) {
          const d = adapter.watch?.(story, onChange)
          if (d) {
            disposers.push(d)
          }
        }
      }

      await subscribeWatchers()

      server.httpServer?.on('close', () => {
        disposers.forEach((d) => d())
        disposers = []
        wss.close()
      })

      // Serve configured `styles` verbatim (raw text/css), bypassing Vite's CSS
      // transform. These are already-built brand stylesheets — running them
      // through the viewer's PostCSS/Tailwind pipeline would fail (e.g. a
      // Tailwind v4 build re-processed by the viewer's v3 plugin). Indexed by
      // position in `config.styles` so only configured files are ever readable.
      server.middlewares.use('/__binbook_style/', async (req, res) => {
        const styles = opts.config.styles ?? []
        // URL is `/<index>.css` (the `.css` lets the viewer tag it as a
        // stylesheet); the index is what selects the configured file.
        const match = /^\/(\d+)(?:\.css)?(?:$|[/?])/.exec(req.url ?? '')
        const idx = match ? Number(match[1]) : -1
        if (idx < 0 || idx >= styles.length) {
          res.statusCode = 404
          res.end()
          return
        }
        try {
          const css = await readFile(path.resolve(opts.root, styles[idx]), 'utf8')
          res.setHeader('content-type', 'text/css; charset=utf-8')
          res.end(css)
        } catch {
          res.statusCode = 404
          res.end()
        }
      })

      // Serve configured `scripts` and their sibling chunks. URL is
      // `/<index>/<relpath>`: <index> selects the configured entry, <relpath> is
      // a file resolved within that entry's directory — so the entry's relative
      // chunk imports (`./chunk-abc.js`) resolve to siblings served here. Sends
      // `Access-Control-Allow-Origin: *` so ES modules load into the sandboxed,
      // opaque-origin canvas (an otherwise-blocked cross-origin module fetch).
      const scriptMime: Record<string, string> = {
        '.js': 'text/javascript; charset=utf-8',
        '.mjs': 'text/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.map': 'application/json; charset=utf-8',
      }
      server.middlewares.use('/__binbook_script/', async (req, res) => {
        const scripts = opts.config.scripts ?? []
        const match = /^\/(\d+)\/(.+?)(?:\?.*)?$/.exec(req.url ?? '')
        const idx = match ? Number(match[1]) : -1
        if (!match || idx < 0 || idx >= scripts.length) {
          res.statusCode = 404
          res.end()
          return
        }
        // Confine reads to the entry's own directory (no path traversal out).
        const dir = path.dirname(path.resolve(opts.root, scripts[idx]))
        const file = path.resolve(dir, match[2])
        if (file !== dir && !file.startsWith(dir + path.sep)) {
          res.statusCode = 403
          res.end()
          return
        }
        try {
          const body = await readFile(file)
          res.setHeader('content-type', scriptMime[path.extname(file)] ?? 'application/octet-stream')
          res.setHeader('access-control-allow-origin', '*')
          res.end(body)
        } catch {
          res.statusCode = 404
          res.end()
        }
      })

      server.middlewares.use(
        '/api/stories',
        guard('GET', async (_req, res) => {
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(await api.stories()))
        })
      )

      server.middlewares.use(
        '/api/render',
        guard('POST', async (req, res) => {
          try {
            const body = await readJson<Parameters<typeof api.render>[0]>(req)
            const result = await api.render(body)
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: (err as Error).message }))
          }
        })
      )

      server.middlewares.use(
        '/api/config',
        guard('GET', async (_req, res) => {
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(api.canvas()))
        })
      )

      server.middlewares.use(
        '/api/update',
        guard('GET', async (_req, res) => {
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(await update))
        })
      )

      server.middlewares.use(
        '/api/docs',
        guard('POST', async (req, res) => {
          try {
            const body = await readJson<Parameters<typeof api.docs>[0]>(req)
            const result = await api.docs(body)
            res.setHeader('content-type', 'application/json')
            res.end(JSON.stringify(result))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: (err as Error).message }))
          }
        })
      )
    },
  }
}

/** Programmatic dev server used by the CLI. */
export async function createDevServer(opts: { root: string; viewerRoot: string; config: BinbookConfig }) {
  const { createServer, searchForWorkspaceRoot } = await import('vite')
  return createServer({
    root: opts.viewerRoot,
    server: {
      port: opts.config.port ?? 6006,
      // Allow the dev server to serve project files (e.g. configured `styles`)
      // via /@fs, not just files under the viewer root.
      fs: { allow: [searchForWorkspaceRoot(opts.root), opts.root, opts.viewerRoot] },
    },
    // Installed from npm, the viewer sits in node_modules, where Vite's dependency scan does not
    // look. Its CommonJS dependencies would reach the browser unbundled, without named exports.
    optimizeDeps: { include: ['react', 'react-dom', 'react-dom/client', 'react/jsx-dev-runtime', 'zustand'] },
    plugins: [binbookServer({ root: opts.root, config: opts.config })],
  })
}

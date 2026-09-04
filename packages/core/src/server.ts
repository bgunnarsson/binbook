import { readFile } from 'node:fs/promises'
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
import { runChat } from './chat'

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

export function binbookServer(opts: { root: string; config: BinbookConfig }): Plugin {
  return {
    name: 'binbook-server',
    async configureServer(server: ViteDevServer) {
      const api = await createApiHandlers(opts)
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

      server.middlewares.use('/api/stories', async (_req, res) => {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(await api.stories()))
      })

      server.middlewares.use('/api/render', async (req, res) => {
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

      server.middlewares.use('/api/config', async (_req, res) => {
        res.setHeader('content-type', 'application/json')
        res.end(JSON.stringify(api.canvas()))
      })

      server.middlewares.use('/api/docs', async (req, res) => {
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

      server.middlewares.use('/api/chat', async (req, res) => {
        try {
          const body = await readJson<Parameters<typeof runChat>[0]>(req)
          const result = await runChat(body)
          res.setHeader('content-type', 'application/json')
          res.end(JSON.stringify(result))
        } catch (err) {
          res.statusCode = 400
          res.end(JSON.stringify({ error: (err as Error).message }))
        }
      })
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
    plugins: [binbookServer({ root: opts.root, config: opts.config })],
  })
}

import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { AstroIntegration } from 'astro'
import { canvasMayLoad } from './canvas-access'
import { FRAME_PATH, RENDER_PATH, type RenderRequest, type RenderResponse, TOKEN_HEADER, fileOf } from './protocol'
import { collectStyles } from './styles'

const TOKEN_MODULE = 'virtual:binbook-astro/token'
const FRAME_RE = /<binbook-frame[^>]*>([\s\S]*)<\/binbook-frame>/
// A component's `<script>`. The canvas cannot load it: see `canvasMayLoad`.
const COMPONENT_SCRIPT_RE = /<script type="module" src="[^"]*\?astro&(?:amp;)?type=script[^"]*"><\/script>/g

function send(res: ServerResponse, status: number, body: RenderResponse): void {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

async function readBody(req: IncomingMessage): Promise<string> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(chunk as Buffer)
  }
  return Buffer.concat(chunks).toString('utf8')
}

function inside(root: string, file: string): boolean {
  const relative = path.relative(root, file)
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}

/**
 * Lets binbook render the project's `.astro` components in `astro dev`. Adds
 * nothing outside the dev server.
 */
export default function binbook(): AstroIntegration {
  const token = randomUUID()
  let root = ''

  return {
    name: '@bgunnarsson/binbook-adapter-astro',
    hooks: {
      'astro:config:setup'({ command, config, injectRoute, updateConfig }) {
        if (command !== 'dev') {
          return
        }
        root = fileURLToPath(config.root)
        injectRoute({ pattern: FRAME_PATH, entrypoint: new URL('./frame.astro', import.meta.url), prerender: false })
        updateConfig({
          vite: {
            plugins: [
              {
                name: 'binbook-astro-token',
                resolveId(id: string) {
                  return id === TOKEN_MODULE ? `\0${TOKEN_MODULE}` : undefined
                },
                load(id: string) {
                  return id === `\0${TOKEN_MODULE}` ? `export default ${JSON.stringify(token)}` : undefined
                },
                // Astro puts its guard against cross-site subresources at the front of the
                // stack once every plugin has configured the server. This plugin comes after
                // Astro's, so its own late step runs last and goes in front of the guard. A
                // request passes the guard once its Fetch Metadata is gone, and a font, which
                // loads in CORS mode, needs the header to reach the canvas's opaque origin.
                configureServer(server) {
                  return () => {
                    server.middlewares.stack.unshift({
                      route: '',
                      handle(req: IncomingMessage, res: ServerResponse, next: () => void) {
                        if (canvasMayLoad(req.headers)) {
                          if (req.headers['sec-fetch-dest'] === 'font') {
                            res.setHeader('access-control-allow-origin', '*')
                          }
                          req.headers['sec-fetch-site'] = undefined
                        }
                        next()
                      },
                    })
                  }
                },
              },
            ],
          },
        })
      },

      'astro:server:setup'({ server }) {
        async function render(req: IncomingMessage, res: ServerResponse): Promise<void> {
          // The adapter calls from Node. A browser always sends Origin on a POST.
          if (req.method !== 'POST' || req.headers.origin) {
            send(res, 404, { error: 'not found' })
            return
          }

          let body: RenderRequest
          try {
            body = JSON.parse(await readBody(req)) as RenderRequest
          } catch {
            send(res, 400, { error: 'the request body is not JSON' })
            return
          }
          if (typeof body.component !== 'string' || !Array.isArray(body.decorators)) {
            send(res, 400, { error: 'the request needs a component path and a decorators list' })
            return
          }
          const files = [...body.decorators, body.component].map(fileOf)
          const outside = files.find((file) => !inside(root, file))
          if (outside) {
            send(res, 403, { error: `${outside} is outside the Astro project at ${root}` })
            return
          }

          const local = server.resolvedUrls?.local[0]
          if (!local) {
            send(res, 503, { error: 'astro dev is not listening yet' })
            return
          }
          const frame = await fetch(new URL(FRAME_PATH, local), {
            method: 'POST',
            headers: { 'content-type': 'application/json', [TOKEN_HEADER]: token },
            body: JSON.stringify(body),
          })
          const page = await frame.text()
          const match = FRAME_RE.exec(page)
          if (!frame.ok || !match) {
            send(res, 500, {
              error: `astro dev could not render ${body.component} (${frame.status}). Its terminal has the error.`,
            })
            return
          }

          // The frame has rendered, so the component's modules are in the graph by now.
          const styles = collectStyles(server.environments.ssr.moduleGraph, files)
          send(res, 200, { html: match[1].replace(COMPONENT_SCRIPT_RE, ''), styles })
        }

        // Ahead of Astro's own middleware, which answers every request it routes.
        server.middlewares.stack.unshift({
          route: RENDER_PATH,
          handle(req: IncomingMessage, res: ServerResponse) {
            render(req, res).catch((err: Error) => send(res, 500, { error: err.message }))
          },
        })
      },
    },
  }
}

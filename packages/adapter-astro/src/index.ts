import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from '@bgunnarsson/binbook-types'
import { RENDER_PATH, type RenderRequest, type RenderResponse, fileOf } from './protocol'

export interface AstroAdapterOptions {
  /**
   * URL of the running `astro dev` server that has the binbook integration
   * added. Defaults to `http://localhost:4321`, Astro's default.
   */
  astroUrl?: string
}

function resolveComponent(story: Story, ref: string): string {
  // ref is relative to the story file's directory, and may name an export after `#`
  const file = fileOf(ref)
  return path.resolve(path.dirname(story.file), file) + ref.slice(file.length)
}

async function post(endpoint: URL, body: RenderRequest): Promise<RenderResponse> {
  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new Error(
      `astro: could not reach astro dev at ${endpoint.origin}. Is it running, with the binbook ` +
        `integration added? (${(err as Error).message})`
    )
  }
  if (res.status === 404) {
    throw new Error(
      `astro: ${endpoint.origin} has no ${RENDER_PATH}. Add the integration from ` +
        '`@bgunnarsson/binbook-adapter-astro/integration` to the Astro config that astro dev runs.'
    )
  }
  const data = (await res.json().catch(() => ({}))) as RenderResponse
  if (!res.ok || data.error) {
    throw new Error(`astro: render failed (${res.status}): ${data.error ?? res.statusText}`)
  }
  return data
}

export function astro(options: AstroAdapterOptions = {}): Adapter {
  const base = new URL(options.astroUrl ?? 'http://localhost:4321')

  return {
    name: 'astro',
    storyGlob: '**/*.binbook.json',

    async render(ctx: RenderContext): Promise<RenderResult> {
      const result = await post(new URL(RENDER_PATH, base), {
        component: resolveComponent(ctx.story, ctx.component),
        props: ctx.args,
        decorators: ctx.decorators ?? [],
      })
      // The markup's scripts, images and fonts are root-relative to the dev server, and so are
      // the stylesheets Astro would have put in the page's head.
      return {
        html: result.html ?? '',
        assets: (result.styles ?? []).map((url) => new URL(url, base).href),
        baseHref: base.origin,
      }
    },

    watch(story: Story, onChange: () => void) {
      // astro dev reloads the changed modules itself; this tells the viewer to render again.
      const componentWatcher = watch(fileOf(resolveComponent(story, story.component)), () => onChange())
      const storyWatcher = watch(story.file, () => onChange())
      return () => {
        componentWatcher.close()
        storyWatcher.close()
      }
    },

    async docs(story: Story): Promise<DocsMeta> {
      return { source: await readFile(fileOf(resolveComponent(story, story.component)), 'utf8') }
    },
  }
}

export default astro

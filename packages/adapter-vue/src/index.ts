import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from '@bgunnarsson/binbook-types'
import { loadServerComponent } from './load-component'
import { buildClientBundle, MOUNT_ID, decoratorFile } from './build-client'

function resolveComponent(story: Story, ref: string): string {
  // ref is relative to the story file's directory
  return path.resolve(path.dirname(story.file), ref)
}

export interface VueAdapterOptions {
  /**
   * Ship a client bundle that hydrates each story so components are interactive
   * in the canvas (reactive state, effects, event handlers). Defaults to `true`;
   * set `false` for static SSR markup only (no client runtime bundle).
   */
  hydrate?: boolean
}

export function vue(options: VueAdapterOptions = {}): Adapter {
  const hydrate = options.hydrate ?? true

  return {
    name: 'vue',
    storyGlob: '**/*.binbook.json',

    async render(ctx: RenderContext): Promise<RenderResult> {
      const abs = resolveComponent(ctx.story, ctx.component)
      const decorators = ctx.decorators ?? []
      const { component, css } = await loadServerComponent(abs)

      // Load decorator components (SFC default exports) and collect their CSS.
      let style = css
      const decComps: unknown[] = []
      for (const ref of decorators) {
        const d = await loadServerComponent(decoratorFile(ref))
        decComps.push(d.component)
        style += d.css
      }

      // Vue is a peer the host installs; this package does not depend on it.
      // biome-ignore lint/suspicious/noExplicitAny: an optional peer with no types at build time
      const { createSSRApp, h } = (await import('vue')) as any
      // biome-ignore lint/suspicious/noExplicitAny: an optional peer with no types at build time
      const { renderToString } = (await import('vue/server-renderer')) as any

      // With no decorators the story is the app root (args are root props); with
      // decorators, compose h(dec, { default: () => child }) outermost-first.
      const app = decorators.length
        ? createSSRApp({
            render: () =>
              decComps.reduceRight(
                (child, Dec) => h(Dec, null, { default: () => child }),
                h(component, ctx.args ?? {})
              ),
          })
        : createSSRApp(component, ctx.args ?? {})
      const markup: string = await renderToString(app)
      const styleTag = style ? `<style>${style}</style>` : ''

      if (!hydrate) {
        return { html: styleTag + markup }
      }

      // Props reach the client on window.__BINBOOK_ARGS__ so the bundle stays
      // arg-independent; escape `<` so the JSON can't break out of the script.
      const argsJson = JSON.stringify(ctx.args ?? {}).replace(/</g, '\\u003c')
      const html = `${styleTag}<div id="${MOUNT_ID}">${markup}</div><script>window.__BINBOOK_ARGS__=${argsJson}</script>`
      const clientScript = await buildClientBundle(abs, decorators)
      return { html, clientScript }
    },

    watch(story: Story, onChange: () => void) {
      const abs = resolveComponent(story, story.component)
      const componentWatcher = watch(abs, () => onChange())
      const storyWatcher = watch(story.file, () => onChange())
      return () => {
        componentWatcher.close()
        storyWatcher.close()
      }
    },

    async docs(story: Story): Promise<DocsMeta> {
      const abs = resolveComponent(story, story.component)
      return { source: await readFile(abs, 'utf8') }
    },
  }
}

export default vue

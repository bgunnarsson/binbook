import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from '@bgunnarsson/binbook-types'
import { loadServerComponent } from './load-component'
import { buildClientBundle, MOUNT_ID } from './build-client'
import { wrapperFor } from './wrapper'

function resolveComponent(story: Story, ref: string): string {
  // ref is relative to the story file's directory
  return path.resolve(path.dirname(story.file), ref)
}

export interface SvelteAdapterOptions {
  /**
   * Ship a client bundle that hydrates each story so components are interactive
   * in the canvas (state, effects, event handlers). Defaults to `true`; set
   * `false` for static SSR markup only (no client runtime bundle).
   */
  hydrate?: boolean
}

export function svelte(options: SvelteAdapterOptions = {}): Adapter {
  const hydrate = options.hydrate ?? true

  return {
    name: 'svelte',
    storyGlob: '**/*.binbook.json',

    async render(ctx: RenderContext): Promise<RenderResult> {
      const abs = resolveComponent(ctx.story, ctx.component)
      // Decorators are applied by compiling a generated wrapper that nests them
      // around the story (Svelte can't compose components at runtime). With no
      // decorators, `entry` is just the story.
      const entry = wrapperFor(abs, ctx.decorators ?? [])
      const Component = await loadServerComponent(entry)
      // Svelte 5 server API. Its result exposes `html`/`head` via getters.
      // Svelte is a peer the host installs; this package does not depend on it,
      // so its types are not resolvable from here.
      // biome-ignore lint/suspicious/noExplicitAny: an optional peer with no types at build time
      const { render } = (await import('svelte/server')) as any
      const rendered = render(Component, { props: ctx.args ?? {} })
      const markup: string = rendered.html ?? ''
      const head: string = rendered.head ?? ''

      if (!hydrate) {
        return { html: head + markup }
      }

      // Props reach the client on window.__BINBOOK_ARGS__ so the bundle stays
      // arg-independent; escape `<` so the JSON can't break out of the script.
      const argsJson = JSON.stringify(ctx.args ?? {}).replace(/</g, '\\u003c')
      const html = `${head}<div id="${MOUNT_ID}">${markup}</div><script>window.__BINBOOK_ARGS__=${argsJson}</script>`
      const clientScript = await buildClientBundle(entry)
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

export default svelte

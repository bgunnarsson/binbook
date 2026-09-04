import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import { createElement } from 'react'
import type { ReactElement } from 'react'
import { renderToStaticMarkup, renderToString } from 'react-dom/server'
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from '@bgunnarsson/binbook-types'
import { loadComponent, parseComponentRef } from './load-component'
import { buildClientBundle, MOUNT_ID } from './build-client'

function resolveComponent(story: Story, ref: string): string {
  // ref is relative to the story file's directory
  return path.resolve(path.dirname(story.file), ref)
}

export interface ReactAdapterOptions {
  /**
   * Ship a client bundle that hydrates each story so components are interactive
   * in the canvas (state, effects, event handlers). Defaults to `true`; set
   * `false` for static markup only (no react-dom/client bundle).
   */
  hydrate?: boolean
}

export function react(options: ReactAdapterOptions = {}): Adapter {
  const hydrate = options.hydrate ?? true

  return {
    name: 'react',
    storyGlob: '**/*.binbook.json',

    async render(ctx: RenderContext): Promise<RenderResult> {
      const { file, exportName } = parseComponentRef(ctx.component)
      const abs = resolveComponent(ctx.story, file)
      const Component = await loadComponent(abs, exportName)

      // Wrap the component in its decorators (outermost first) — providers the
      // component needs to render in isolation (router, theme, store, …).
      const decorators = ctx.decorators ?? []
      const wrap = async (node: ReactElement): Promise<ReactElement> => {
        let el = node
        for (let i = decorators.length - 1; i >= 0; i--) {
          const ref = parseComponentRef(decorators[i])
          const Dec = await loadComponent(ref.file, ref.exportName)
          el = createElement(Dec, null, el)
        }
        return el
      }

      if (!hydrate) {
        const el = await wrap(createElement(Component, { ...ctx.args }))
        return { html: renderToStaticMarkup(el) }
      }

      // renderToString (not renderToStaticMarkup) produces hydration-compatible
      // markup. Args are handed to the client on window.__BINBOOK_ARGS__ so the
      // bundle stays arg-independent; escape `<` so the JSON can't break out of
      // the inline <script>.
      const el = await wrap(createElement(Component, { ...ctx.args }))
      const markup = renderToString(el)
      const argsJson = JSON.stringify(ctx.args ?? {}).replace(/</g, '\\u003c')
      const html = `<div id="${MOUNT_ID}">${markup}</div>` + `<script>window.__BINBOOK_ARGS__=${argsJson}</script>`
      const clientScript = await buildClientBundle(abs, exportName, decorators)
      return { html, clientScript }
    },

    watch(story: Story, onChange: () => void) {
      const { file } = parseComponentRef(story.component)
      const abs = resolveComponent(story, file)
      const componentWatcher = watch(abs, () => onChange())
      const storyWatcher = watch(story.file, () => onChange())
      return () => {
        componentWatcher.close()
        storyWatcher.close()
      }
    },

    async docs(story: Story): Promise<DocsMeta> {
      const { file } = parseComponentRef(story.component)
      const abs = resolveComponent(story, file)
      return { source: await readFile(abs, 'utf8') }
    },
  }
}

export default react

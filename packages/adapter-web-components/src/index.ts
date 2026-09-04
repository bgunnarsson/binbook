import { readFile } from 'node:fs/promises'
import { watch } from 'node:fs'
import path from 'node:path'
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from '@bgunnarsson/binbook-types'
import { buildClientBundle } from './build-client'

/** A component ref is `<file>` or `<file>#<custom-element-tag>`. */
export function parseComponentRef(ref: string): { file: string; tag?: string } {
  const hash = ref.indexOf('#')
  if (hash === -1) {
    return { file: ref }
  }
  return { file: ref.slice(0, hash), tag: ref.slice(hash + 1) || undefined }
}

/** Find the element's tag from an explicit `customElements.define` / `@customElement`. */
export function detectTag(source: string): string | undefined {
  const m =
    source.match(/customElements\s*\.\s*define\(\s*['"]([a-z][\w-]*)['"]/) ??
    source.match(/@customElement\(\s*['"]([a-z][\w-]*)['"]/)
  return m?.[1]
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }
function escapeAttr(value: string): string {
  return value.replace(/[&<>"]/g, (c) => ESC[c])
}

/**
 * Renders args as element attributes. Booleans use HTML boolean-attribute
 * semantics (present when true); everything else is a stringified, escaped
 * `name="value"`. Lit's `@property({ type })` and vanilla `observedAttributes`
 * both read these back.
 */
export function renderAttrs(args: Record<string, unknown>): string {
  let out = ''
  for (const [name, value] of Object.entries(args)) {
    if (value === undefined || value === null) {
      continue
    }
    if (typeof value === 'boolean') {
      if (value) {
        out += ` ${name}`
      }
      continue
    }
    out += ` ${name}="${escapeAttr(String(value))}"`
  }
  return out
}

function componentPath(story: Story, ref: string): string {
  return path.resolve(path.dirname(story.file), ref)
}

/**
 * Renders custom elements — vanilla web components or Lit. The story markup is
 * the element's tag with args applied as attributes; a `clientScript` bundle
 * (the component's module, with Lit bundled in when used) defines the element
 * so it upgrades and renders live inside the sandboxed canvas.
 */
export function webComponents(): Adapter {
  return {
    name: 'web-components',
    storyGlob: '**/*.binbook.json',

    async render(ctx: RenderContext): Promise<RenderResult> {
      const { file, tag: explicitTag } = parseComponentRef(ctx.component)
      const abs = componentPath(ctx.story, file)
      const source = await readFile(abs, 'utf8')
      const tag = explicitTag ?? detectTag(source)
      if (!tag) {
        throw new Error(
          `web-components adapter: couldn't determine the custom element tag for ${file}. ` +
            `Name it in the component ref (e.g. "${file}#my-element") or register it with ` +
            `customElements.define("my-element", …).`
        )
      }
      const clientScript = await buildClientBundle(abs)
      return { html: `<${tag}${renderAttrs(ctx.args)}></${tag}>`, clientScript }
    },

    watch(story: Story, onChange: () => void) {
      const abs = componentPath(story, parseComponentRef(story.component).file)
      const componentWatcher = watch(abs, () => onChange())
      const storyWatcher = watch(story.file, () => onChange())
      return () => {
        componentWatcher.close()
        storyWatcher.close()
      }
    },

    async docs(story: Story): Promise<DocsMeta> {
      const abs = componentPath(story, parseComponentRef(story.component).file)
      return { source: await readFile(abs, 'utf8') }
    },
  }
}

export default webComponents

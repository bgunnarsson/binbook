import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from 'vitest'
import webComponents, { parseComponentRef, detectTag, renderAttrs } from './index'
import type { RenderContext, Story } from '@bgunnarsson/binbook-types'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '../test/fixtures')

const story: Story = {
  id: 'components-button',
  title: 'Components/Button',
  component: './my-button.js#my-button',
  args: {},
  variants: [],
  file: path.join(root, 'button.binbook.json'),
}

const ctx = (args: Record<string, unknown>, component = './my-button.js#my-button'): RenderContext => ({
  story,
  component,
  args,
  root,
})

test('adapter metadata', () => {
  expect(webComponents().name).toBe('web-components')
  expect(webComponents().storyGlob).toBe('**/*.binbook.json')
})

test('parseComponentRef splits file and tag on #', () => {
  expect(parseComponentRef('./x.js#my-el')).toEqual({ file: './x.js', tag: 'my-el' })
  expect(parseComponentRef('./x.js')).toEqual({ file: './x.js' })
})

test('detectTag finds define() and @customElement', () => {
  expect(detectTag('customElements.define("my-el", X)')).toBe('my-el')
  expect(detectTag('@customElement("lit-el")\nclass X {}')).toBe('lit-el')
  expect(detectTag('no element here')).toBeUndefined()
})

test('renderAttrs uses boolean-attribute semantics and escapes values', () => {
  expect(renderAttrs({ label: 'Buy', variant: 'ghost' })).toBe(' label="Buy" variant="ghost"')
  expect(renderAttrs({ disabled: true, hidden: false })).toBe(' disabled')
  expect(renderAttrs({ label: '"><x' })).toBe(' label="&quot;&gt;&lt;x"')
  expect(renderAttrs({ label: null, n: undefined })).toBe('')
})

test('render emits the element tag with args as attributes and a defining bundle', async () => {
  const result = await webComponents().render(ctx({ variant: 'ghost', label: 'Buy' }))
  expect(result.html).toBe('<my-button variant="ghost" label="Buy"></my-button>')
  expect(result.clientScript).toContain('customElements.define')
  expect(result.clientScript).not.toContain('</script>')
})

test('the tag is auto-detected when the ref omits it', async () => {
  const result = await webComponents().render(ctx({ label: 'Hi' }, './my-button.js'))
  expect(result.html).toBe('<my-button label="Hi"></my-button>')
})

test('args change the rendered output', async () => {
  const withArgs = await webComponents().render(ctx({ variant: 'ghost', label: 'Buy' }))
  const empty = await webComponents().render(ctx({}))
  expect(withArgs.html).not.toBe(empty.html)
  expect(empty.html).toBe('<my-button></my-button>')
})

test('docs returns the component source', async () => {
  const meta = await webComponents().docs?.(story)
  expect(meta?.source).toContain('customElements.define("my-button"')
})

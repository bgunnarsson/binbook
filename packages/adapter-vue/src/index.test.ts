import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from 'vitest'
import vue from './index'
import type { RenderContext, Story } from '@bgunnarsson/binbook-types'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '../test/fixtures')

const story: Story = {
  id: 'components-button',
  title: 'Components/Button',
  component: './Button.vue',
  args: {},
  variants: [],
  file: path.join(root, 'Button.binbook.json'),
}

const ctx = (args: Record<string, unknown>, component = './Button.vue'): RenderContext => ({
  story,
  component,
  args,
  root,
})

test('adapter metadata', () => {
  expect(vue().name).toBe('vue')
  expect(vue().storyGlob).toBe('**/*.binbook.json')
})

test('static mode (hydrate:false) server-renders markup and ships no client script', async () => {
  const result = await vue({ hydrate: false }).render(ctx({ variant: 'ghost', label: 'Buy' }))
  expect(result.html).toBe('<button class="btn btn--ghost">Buy</button>')
  expect(result.clientScript).toBeUndefined()
})

test('hydration wraps markup in the mount root and exposes props to the client', async () => {
  const result = await vue().render(ctx({ variant: 'ghost', label: 'Buy' }))
  expect(result.html).toContain('<div id="binbook-root">')
  expect(result.html).toContain('<button class="btn btn--ghost">Buy</button>')
  expect(result.html).toContain('window.__BINBOOK_ARGS__={"variant":"ghost","label":"Buy"}')
  // Self-contained client bundle that mounts onto the SSR root, no stray close tag.
  expect(result.clientScript).toContain('binbook-root')
  expect(result.clientScript).toContain('.mount(')
  expect(result.clientScript).not.toContain('</script>')
})

test('props change the rendered output', async () => {
  const ghost = await vue().render(ctx({ variant: 'ghost', label: 'A' }))
  const primary = await vue().render(ctx({ variant: 'primary', label: 'B' }))
  expect(ghost.html).toContain('btn--ghost')
  expect(primary.html).toContain('btn--primary')
  expect(ghost.html).not.toBe(primary.html)
})

test('scoped styles are compiled and injected into the markup', async () => {
  const result = await vue({ hydrate: false }).render({ ...ctx({ title: 'Hi' }, './Card.vue') })
  // A scoped style emits a `<style>` and a matching data-v scope attribute.
  expect(result.html).toMatch(/<style>.*\.card\[data-v-[0-9a-f]+\].*<\/style>/s)
  expect(result.html).toMatch(/<article class="card" data-v-[0-9a-f]+>/)
})

test('decorators wrap the component for SSR and the client bundle', async () => {
  const frame = path.join(root, 'withFrame.vue')
  const result = await vue().render({ ...ctx({ variant: 'ghost', label: 'Buy' }), decorators: [frame] })
  expect(result.html).toContain('<div data-decorator="frame">')
  expect(result.html).toContain('<button class="btn btn--ghost">Buy</button>')
  expect(result.html.indexOf('data-decorator="frame"')).toBeLessThan(result.html.indexOf('<button'))
  expect(result.clientScript).toContain('binbook-root')
})

test("args JSON is escaped so it can't break out of the inline script", async () => {
  const result = await vue().render(ctx({ label: '</script><b>x', variant: 'primary' }))
  expect(result.html).not.toContain('</script><b>x')
  expect(result.html).toContain('\\u003c/script>')
})

test('docs returns the component source', async () => {
  const meta = await vue().docs!(story)
  expect(meta.source).toContain('btn btn--${variant}')
})

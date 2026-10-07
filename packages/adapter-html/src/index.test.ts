import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from 'vitest'
import html from './index'
import type { RenderContext, Story } from '@bgunnarsson/binbook-types'

const dir = path.dirname(fileURLToPath(import.meta.url))
const fixtureFile = path.join(dir, '../test/fixtures/button.binbook.json')

const story: Story = {
  id: 'components-button',
  title: 'Components/Button',
  component: './button.html',
  args: {},
  variants: [],
  file: fixtureFile,
}

const ctx = (args: Record<string, unknown>): RenderContext => ({
  story,
  component: './button.html',
  args,
  root: path.join(dir, '../test/fixtures'),
})

test('adapter metadata', () => {
  expect(html().name).toBe('html')
  expect(html().storyGlob).toBe('**/*.binbook.json')
})

test('render resolves component relative to the story file and interpolates', async () => {
  const result = await html().render(ctx({ variant: 'ghost', label: 'Buy', disabled: true }))
  expect(result.html).toBe('<button class="btn btn--ghost" disabled>Buy</button>')
})

test('docs returns the component source', async () => {
  const meta = await html().docs?.(story)
  expect(meta?.source).toContain('btn--{{variant}}')
})

import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from 'vitest'
import { createApiHandlers } from './server'
import html from '@bgunnarsson/binbook-adapter-html'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '../test/fixtures/project')

test('GET /api/stories returns the tree and story list', async () => {
  const api = await createApiHandlers({
    root,
    config: { stories: [`${root}/**/*.binbook.json`], adapters: [html()], port: 6006 },
  })
  const res = await api.stories()
  expect(res.tree.length).toBeGreaterThan(0)
  expect(res.stories.some((s) => s.title === 'Components/Button')).toBe(true)
})

test('POST /api/render renders a variant with live args', async () => {
  const api = await createApiHandlers({
    root,
    config: { stories: [`${root}/**/*.binbook.json`], adapters: [html()], port: 6006 },
  })
  const result = await api.render({ storyId: 'components-button', variant: 'Default', args: { label: 'Hi' } })
  expect(result.html).toContain('Hi')
})

test('api.docs returns the component source', async () => {
  const api = await createApiHandlers({
    root,
    config: { stories: [`${root}/**/*.binbook.json`], adapters: [html()], port: 6006 },
  })
  const meta = await api.docs({ storyId: 'components-button' })
  expect(meta?.source).toContain('btn--{{variant}}')
})

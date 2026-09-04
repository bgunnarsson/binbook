import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test, vi } from 'vitest'
import { discoverStories } from './discover'

const root = path.dirname(fileURLToPath(import.meta.url))
const fixtures = path.join(root, '../test/fixtures/stories')
const mixedFixtures = path.join(root, '../test/fixtures/mixed')

test('discovers all .binbook.json files under the glob', async () => {
  const stories = await discoverStories({ stories: [`${fixtures}/**/*.binbook.json`] })
  expect(stories.map((s) => s.title).sort()).toEqual(['Components/Button', 'Components/Card'])
})

test('skips malformed story files without throwing', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const stories = await discoverStories({ stories: [`${mixedFixtures}/**/*.binbook.json`] })
  expect(stories).toHaveLength(1)
  expect(stories[0]?.title).toBe('Components/Good')
  warn.mockRestore()
})

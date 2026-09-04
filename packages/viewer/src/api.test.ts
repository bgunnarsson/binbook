import { expect, test, vi } from 'vitest'
import { fetchStories, renderStory } from './api'

test('fetchStories calls /api/stories and returns json', async () => {
  const payload = { tree: [], stories: [] }
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => ({ ok: true, json: async () => payload }))
  )
  expect(await fetchStories()).toEqual(payload)
})

test('renderStory POSTs body to /api/render', async () => {
  const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ html: '<b>x</b>' }) }))
  vi.stubGlobal('fetch', fetchMock)
  const result = await renderStory({ storyId: 's', variant: 'Default', args: { a: 1 } })
  expect(result.html).toBe('<b>x</b>')
  expect(fetchMock).toHaveBeenCalledWith('/api/render', expect.objectContaining({ method: 'POST' }))
})

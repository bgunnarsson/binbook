import { expect, test, vi } from 'vitest'
import type { Adapter, Story } from '@bgunnarsson/binbook-types'
import { expandStories } from './expand'
import { AdapterRegistry } from './registry'

function story(id: string, over: Partial<Story> = {}): Story {
  return {
    id,
    title: id,
    component: './x',
    args: {},
    variants: [{ name: 'Default', args: {} }],
    file: `/abs/${id}.binbook.json`,
    ...over,
  }
}

function adapter(over: Partial<Adapter> = {}): Adapter {
  return {
    name: 'test',
    storyGlob: '**/*.binbook.json',
    render: async () => ({ html: '' }),
    ...over,
  }
}

test('passes stories through unchanged when the adapter has no expand hook', async () => {
  const registry = new AdapterRegistry([adapter()])
  const stories = [story('a'), story('b')]
  expect(await expandStories(registry, stories)).toEqual(stories)
})

test('substitutes a manifest with its expanded stories', async () => {
  const expand = vi.fn(async (s: Story) => (s.id === 'manifest' ? [story('block-hero'), story('block-cta')] : [s]))
  const registry = new AdapterRegistry([adapter({ expand })])
  const out = await expandStories(registry, [story('keep'), story('manifest')])
  expect(out.map((s) => s.id)).toEqual(['keep', 'block-hero', 'block-cta'])
})

test('a throwing expand drops only its own story and warns', async () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const expand = vi.fn(async (s: Story) => {
    if (s.id === 'boom') {
      throw new Error('endpoint down')
    }
    return [s]
  })
  const registry = new AdapterRegistry([adapter({ expand })])
  const out = await expandStories(registry, [story('keep'), story('boom')])
  expect(out.map((s) => s.id)).toEqual(['keep'])
  expect(warn).toHaveBeenCalledWith(expect.stringContaining('endpoint down'))
  warn.mockRestore()
})

import { expect, test } from 'vitest'
import { parseStoryFile } from './parse-story'

const raw = {
  title: 'Components/Button',
  description: 'Primary CTA.',
  component: './button.html',
  args: {
    label: { type: 'text', default: 'Click me' },
    variant: { type: 'select', options: ['primary', 'ghost'], default: 'primary' },
  },
  stories: [
    { name: 'Default', args: {} },
    { name: 'Ghost', args: { variant: 'ghost' } },
  ],
}

test('parses a valid story file into a Story', () => {
  const story = parseStoryFile(raw, '/abs/button.binbook.json')
  expect(story.title).toBe('Components/Button')
  expect(story.file).toBe('/abs/button.binbook.json')
  expect(story.variants.map((v) => v.name)).toEqual(['Default', 'Ghost'])
  expect(story.id).toBe('components-button')
})

test('parses optional decorators', () => {
  const withDecos = { ...raw, decorators: ['../deco/withRouter.tsx', './withTheme.tsx#Theme'] }
  const story = parseStoryFile(withDecos, '/abs/button.binbook.json')
  expect(story.decorators).toEqual(['../deco/withRouter.tsx', './withTheme.tsx#Theme'])
  // absent by default
  expect(parseStoryFile(raw, '/abs/button.binbook.json').decorators).toBeUndefined()
})

test('normalizes a string wrapper and leaves it on the story', () => {
  const story = parseStoryFile({ ...raw, wrapper: '  width: 400px  ' }, '/abs/x.binbook.json')
  expect(story.wrapper).toBe('width: 400px')
})

test('normalizes an object wrapper, kebab-casing camelCase keys', () => {
  const story = parseStoryFile({ ...raw, wrapper: { maxWidth: '400px', padding: 16 } }, '/abs/x.binbook.json')
  expect(story.wrapper).toBe('max-width: 400px; padding: 16')
})

test('a per-variant wrapper overrides and is normalized independently', () => {
  const story = parseStoryFile(
    { ...raw, wrapper: 'width: 400px', stories: [{ name: 'Wide', args: {}, wrapper: { width: '800px' } }] },
    '/abs/x.binbook.json'
  )
  expect(story.wrapper).toBe('width: 400px')
  expect(story.variants[0].wrapper).toBe('width: 800px')
})

test('omits wrapper when absent or empty', () => {
  expect(parseStoryFile(raw, '/abs/x.binbook.json').wrapper).toBeUndefined()
  expect(parseStoryFile({ ...raw, wrapper: '   ' }, '/abs/x.binbook.json').wrapper).toBeUndefined()
})

test('rejects a select arg missing options', () => {
  const bad = { ...raw, args: { variant: { type: 'select', default: 'x' } } }
  expect(() => parseStoryFile(bad, '/abs/x.binbook.json')).toThrow(/options/i)
})

test('rejects unknown arg type', () => {
  const bad = { ...raw, args: { when: { type: 'date', default: 'x' } } }
  expect(() => parseStoryFile(bad, '/abs/x.binbook.json')).toThrow()
})

test('requires component and stories for a normal story', () => {
  const { component, stories, ...noComponent } = raw
  void component
  void stories
  expect(() => parseStoryFile(noComponent, '/abs/x.binbook.json')).toThrow(/component/i)
  expect(() => parseStoryFile({ ...raw, stories: undefined }, '/abs/x.binbook.json')).toThrow(/story/i)
})

test('parses a Block List manifest without component or stories', () => {
  const manifest = {
    title: 'Blocks',
    umbraco: { mode: 'live', blockList: { content: { route: '/showcase' }, property: 'blocks' } },
  }
  const story = parseStoryFile(manifest, '/abs/blocks.binbook.json')
  expect(story.umbraco?.blockList).toEqual({ content: { route: '/showcase' }, property: 'blocks' })
  expect(story.component).toBe('')
  // A placeholder variant keeps the manifest a valid Story until it is expanded.
  expect(story.variants).toEqual([{ name: 'Default', args: {}, wrapper: undefined }])
})

test("parses a per-block story's block selector", () => {
  const blockStory = {
    ...raw,
    umbraco: { mode: 'live', content: { route: '/showcase' }, block: { property: 'blocks', type: 'heroBlock' } },
  }
  const story = parseStoryFile(blockStory, '/abs/x.binbook.json')
  expect(story.umbraco?.block).toEqual({ property: 'blocks', type: 'heroBlock' })
})

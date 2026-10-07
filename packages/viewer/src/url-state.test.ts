import { describe, expect, test } from 'vitest'
import type { Story } from '@bgunnarsson/binbook-types'
import { decodeUrlState, encodeUrlState, resolveSelection } from './url-state'

const story = (id: string, variants: string[]): Story => ({
  id,
  title: id,
  component: `${id}.html`,
  args: {},
  variants: variants.map((name) => ({ name, args: {} })),
  file: `/${id}.binbook.json`,
})

describe('encodeUrlState', () => {
  test('serializes story, variant, viewport and args', () => {
    const s = encodeUrlState({
      storyId: 'components-button',
      variant: 'Default',
      viewport: 'mobile',
      args: { label: 'Hi' },
    })
    const params = new URLSearchParams(s)
    expect(params.get('story')).toBe('components-button')
    expect(params.get('v')).toBe('Default')
    expect(params.get('vp')).toBe('mobile')
    expect(JSON.parse(params.get('args') ?? 'null')).toEqual({ label: 'Hi' })
  })

  test('omits the responsive viewport and empty args to keep links short', () => {
    const s = encodeUrlState({ storyId: 'x', variant: 'Default', viewport: 'responsive', args: {} })
    const params = new URLSearchParams(s)
    expect(params.has('vp')).toBe(false)
    expect(params.has('args')).toBe(false)
    expect(params.get('story')).toBe('x')
  })

  test('returns an empty string when there is nothing to encode', () => {
    expect(encodeUrlState({})).toBe('')
  })
})

describe('decodeUrlState', () => {
  test('round-trips an encoded state', () => {
    const input = { storyId: 'a', variant: 'B', viewport: 'tablet', args: { n: 1 } }
    expect(decodeUrlState(encodeUrlState(input))).toEqual(input)
  })

  test('ignores malformed args but keeps the rest', () => {
    const decoded = decodeUrlState('?story=a&v=B&args=not-json')
    expect(decoded).toEqual({ storyId: 'a', variant: 'B' })
  })

  test('ignores non-object args (arrays, primitives)', () => {
    expect(decodeUrlState('?args=[1,2]').args).toBeUndefined()
    expect(decodeUrlState('?args=42').args).toBeUndefined()
  })
})

describe('resolveSelection', () => {
  const stories = [story('btn', ['Default', 'Disabled']), story('card', ['Basic'])]

  test('returns the exact story + variant when both exist', () => {
    expect(resolveSelection(stories, 'btn', 'Disabled')).toEqual({ storyId: 'btn', variant: 'Disabled' })
  })

  test('falls back to the first variant when the variant is unknown', () => {
    expect(resolveSelection(stories, 'btn', 'Ghost')).toEqual({ storyId: 'btn', variant: 'Default' })
  })

  test('falls back to the first variant when no variant is given', () => {
    expect(resolveSelection(stories, 'card', undefined)).toEqual({ storyId: 'card', variant: 'Basic' })
  })

  test('returns null for an unknown or missing story', () => {
    expect(resolveSelection(stories, 'nope', 'Default')).toBeNull()
    expect(resolveSelection(stories, undefined, 'Default')).toBeNull()
  })
})

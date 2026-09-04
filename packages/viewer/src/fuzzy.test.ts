import { expect, test } from 'vitest'
import { fuzzyMatch } from './fuzzy'

test('matches subsequence case-insensitively', () => {
  expect(fuzzyMatch('btn', 'Components/Button')).toBe(true)
  expect(fuzzyMatch('card', 'Components/Button')).toBe(false)
})

test('empty query matches everything', () => {
  expect(fuzzyMatch('', 'anything')).toBe(true)
})

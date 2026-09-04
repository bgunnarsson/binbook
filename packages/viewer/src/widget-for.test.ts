import { expect, test } from 'vitest'
import { widgetFor } from './widget-for'

test('maps arg types to widget kinds', () => {
  expect(widgetFor({ type: 'text', default: '' })).toBe('input')
  expect(widgetFor({ type: 'select', options: ['a'], default: 'a' })).toBe('dropdown')
  expect(widgetFor({ type: 'boolean', default: false })).toBe('checkbox')
  expect(widgetFor({ type: 'number', default: 0 })).toBe('stepper')
  expect(widgetFor({ type: 'color', default: '#000' })).toBe('swatch')
})

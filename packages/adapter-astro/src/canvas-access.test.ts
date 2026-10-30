import { expect, test } from 'vitest'
import { canvasMayLoad } from './canvas-access'

test('a cross-site stylesheet, image or font may pass', () => {
  expect(canvasMayLoad({ 'sec-fetch-site': 'cross-site', 'sec-fetch-dest': 'style' })).toBe(true)
  expect(canvasMayLoad({ 'sec-fetch-site': 'cross-site', 'sec-fetch-dest': 'image' })).toBe(true)
  expect(canvasMayLoad({ 'sec-fetch-site': 'cross-origin', 'sec-fetch-dest': 'font' })).toBe(true)
})

test('a cross-site script or fetch, or a request the guard already lets through, does not', () => {
  expect(canvasMayLoad({ 'sec-fetch-site': 'cross-site', 'sec-fetch-dest': 'script' })).toBe(false)
  expect(canvasMayLoad({ 'sec-fetch-site': 'cross-site', 'sec-fetch-dest': 'empty' })).toBe(false)
  expect(canvasMayLoad({ 'sec-fetch-site': 'cross-site' })).toBe(false)
  expect(canvasMayLoad({ 'sec-fetch-site': 'same-origin', 'sec-fetch-dest': 'style' })).toBe(false)
  expect(canvasMayLoad({ 'sec-fetch-dest': 'style' })).toBe(false)
})

import { expect, test } from 'vitest'
import { frameRequest, ResponseDecoder } from './protocol'

test('frameRequest emits one newline-terminated JSON line', () => {
  const frame = frameRequest({ id: 3, templatePath: '/x/Button.cshtml', args: { label: 'Buy' } })
  expect(frame.endsWith('\n')).toBe(true)
  expect(frame.includes('\n', 0)).toBe(true)
  expect(JSON.parse(frame.trimEnd())).toEqual({
    id: 3,
    templatePath: '/x/Button.cshtml',
    args: { label: 'Buy' },
  })
})

test('decoder assembles responses split across chunks', () => {
  const d = new ResponseDecoder()
  expect(d.push('{"id":1,"html":"<b>')).toEqual([])
  const out = d.push('hi</b>"}\n{"id":2,"error":"boom"}\n')
  expect(out).toEqual([
    { id: 1, html: '<b>hi</b>' },
    { id: 2, error: 'boom' },
  ])
})

test('decoder ignores blank lines and keeps trailing partial buffered', () => {
  const d = new ResponseDecoder()
  const out = d.push('\n{"id":5,"html":"ok"}\n{"id":6')
  expect(out).toEqual([{ id: 5, html: 'ok' }])
  expect(d.push(',"html":"tail"}\n')).toEqual([{ id: 6, html: 'tail' }])
})

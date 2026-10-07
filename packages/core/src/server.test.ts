import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { expect, test } from 'vitest'
import { createApiHandlers, rejectApiRequest } from './server'
import html from '@bgunnarsson/binbook-adapter-html'
import type { Connect } from 'vite'

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

function request(method: string, headers: Record<string, string>): Connect.IncomingMessage {
  return { method, headers: { host: 'localhost:6006', ...headers } } as unknown as Connect.IncomingMessage
}

test('rejectApiRequest refuses a cross-origin request with 403', () => {
  const req = request('POST', { origin: 'http://evil.test', 'content-type': 'text/plain' })
  expect(rejectApiRequest(req, 'POST')).toBe(403)
  expect(rejectApiRequest(request('POST', { origin: 'null' }), 'POST')).toBe(403)
})

test('rejectApiRequest refuses a DNS-rebound request whose Host is not local with 403', () => {
  const rebound = { host: 'evil.test:6006', origin: 'http://evil.test:6006', 'content-type': 'application/json' }
  expect(rejectApiRequest(request('POST', rebound), 'POST')).toBe(403)
  expect(rejectApiRequest(request('GET', { host: 'evil.test:6006' }), 'GET')).toBe(403)
})

test('rejectApiRequest allows loopback names and IPs as Host', () => {
  for (const host of ['localhost:6006', 'app.localhost:6006', '127.0.0.1:6006', '[::1]:6006', '192.168.1.5:6006']) {
    expect(rejectApiRequest(request('GET', { host, origin: `http://${host}` }), 'GET')).toBeUndefined()
  }
})

test('rejectApiRequest refuses the wrong method with 405', () => {
  expect(rejectApiRequest(request('GET', {}), 'POST')).toBe(405)
  expect(rejectApiRequest(request('POST', { 'content-type': 'application/json' }), 'GET')).toBe(405)
})

test('rejectApiRequest refuses a non-JSON POST with 415', () => {
  expect(rejectApiRequest(request('POST', { 'content-type': 'text/plain' }), 'POST')).toBe(415)
  expect(rejectApiRequest(request('POST', {}), 'POST')).toBe(415)
})

test('rejectApiRequest allows same-origin and no-Origin requests', () => {
  const json = { 'content-type': 'application/json; charset=utf-8' }
  expect(rejectApiRequest(request('POST', { origin: 'http://localhost:6006', ...json }), 'POST')).toBeUndefined()
  expect(rejectApiRequest(request('POST', json), 'POST')).toBeUndefined()
  expect(rejectApiRequest(request('GET', { origin: 'http://localhost:6006' }), 'GET')).toBeUndefined()
})

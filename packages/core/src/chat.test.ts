import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { runChat } from './chat'

const create = vi.hoisted(() => vi.fn(async () => ({ content: [{ type: 'text', text: 'hello' }] })))
vi.mock('@anthropic-ai/sdk', () => ({
  default: class {
    messages = { create }
  },
}))

let saved: string | undefined
// `delete` is the only way to unset an environment variable: assigning
// undefined stores the string "undefined", which is a value, and the code under
// test would read it as a configured key.
beforeEach(() => {
  saved = process.env.ANTHROPIC_API_KEY
  // biome-ignore lint/performance/noDelete: unsetting an env var has no other spelling
  delete process.env.ANTHROPIC_API_KEY
})
afterEach(() => {
  if (saved === undefined) {
    // biome-ignore lint/performance/noDelete: unsetting an env var has no other spelling
    delete process.env.ANTHROPIC_API_KEY
  } else {
    process.env.ANTHROPIC_API_KEY = saved
  }
})

test('returns not_configured when no API key is set', async () => {
  const reply = await runChat({ messages: [{ role: 'user', content: 'hi' }] })
  expect(reply.error).toBe('not_configured')
  expect(reply.text).toBeUndefined()
})

test('sends the default model when none is configured', async () => {
  process.env.ANTHROPIC_API_KEY = 'test'
  const reply = await runChat({ messages: [{ role: 'user', content: 'hi' }] })
  expect(reply.text).toBe('hello')
  expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ model: 'claude-opus-5-5' }))
})

test('sends the configured model', async () => {
  process.env.ANTHROPIC_API_KEY = 'test'
  await runChat({ messages: [{ role: 'user', content: 'hi' }] }, 'claude-sonnet-5-5')
  expect(create).toHaveBeenLastCalledWith(expect.objectContaining({ model: 'claude-sonnet-5-5' }))
})

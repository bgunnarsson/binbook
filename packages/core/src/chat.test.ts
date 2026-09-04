import { afterEach, beforeEach, expect, test } from 'vitest'
import { runChat } from './chat'

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

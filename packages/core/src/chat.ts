export interface ChatBody {
  system?: string
  messages: { role: 'user' | 'assistant'; content: string }[]
}
export interface ChatReply {
  text?: string
  error?: string
}

export const DEFAULT_CHAT_MODEL = 'claude-opus-5-5'

/** Proxies the Anthropic Messages API. Returns { error: "not_configured" }
 *  when ANTHROPIC_API_KEY is absent so the UI can prompt the user. */
export async function runChat(body: ChatBody, model = DEFAULT_CHAT_MODEL): Promise<ChatReply> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { error: 'not_configured' }
  }
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()
    const resp = await client.messages.create({
      model,
      max_tokens: 1024,
      system: body.system,
      messages: body.messages,
    })
    const text = resp.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { text: string }).text)
      .join('')
    return { text }
  } catch (err) {
    return { error: (err as Error).message }
  }
}

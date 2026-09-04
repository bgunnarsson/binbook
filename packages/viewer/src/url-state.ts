import type { Story } from '@bgunnarsson/binbook-types'

/** The slice of viewer state that round-trips through the URL query string. */
export interface UrlState {
  storyId: string
  variant: string
  viewport: string // a Viewport `key` (see viewports.ts)
  args: Record<string, unknown>
}

/** Result of parsing a query string — every field is optional / best-effort. */
export interface DecodedUrlState {
  storyId?: string
  variant?: string
  viewport?: string
  args?: Record<string, unknown>
}

// The responsive viewport is the default; omit it from the URL to keep links tidy.
const DEFAULT_VIEWPORT = 'responsive'

/**
 * Serialize viewer state into a URL search string (leading "?", or "" when
 * nothing meaningful is set). Defaults and empties are dropped so a freshly
 * opened story yields a short, stable link.
 */
export function encodeUrlState(state: Partial<UrlState>): string {
  const params = new URLSearchParams()
  if (state.storyId) {
    params.set('story', state.storyId)
  }
  if (state.variant) {
    params.set('v', state.variant)
  }
  if (state.viewport && state.viewport !== DEFAULT_VIEWPORT) {
    params.set('vp', state.viewport)
  }
  if (state.args && Object.keys(state.args).length > 0) {
    params.set('args', JSON.stringify(state.args))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

/**
 * Parse a URL search string back into partial viewer state. Malformed or
 * non-object `args` are ignored rather than throwing, so a hand-edited link
 * degrades gracefully instead of breaking the viewer.
 */
export function decodeUrlState(search: string): DecodedUrlState {
  const params = new URLSearchParams(search)
  const out: DecodedUrlState = {}
  const story = params.get('story')
  if (story) {
    out.storyId = story
  }
  const v = params.get('v')
  if (v) {
    out.variant = v
  }
  const vp = params.get('vp')
  if (vp) {
    out.viewport = vp
  }
  const args = params.get('args')
  if (args) {
    try {
      const parsed: unknown = JSON.parse(args)
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        out.args = parsed as Record<string, unknown>
      }
    } catch {
      // Malformed args — ignore and keep the rest of the state.
    }
  }
  return out
}

/**
 * Resolve a decoded story reference against the live catalog. Returns a valid
 * `{ storyId, variant }` or `null` when the story doesn't exist. A missing or
 * unknown variant falls back to the story's first variant, so a link that
 * points at a since-renamed variant still lands on the right story.
 */
export function resolveSelection(
  stories: Story[],
  storyId: string | undefined,
  variant: string | undefined
): { storyId: string; variant: string } | null {
  if (!storyId) {
    return null
  }
  const story = stories.find((s) => s.id === storyId)
  if (!story || story.variants.length === 0) {
    return null
  }
  const matched = variant != null && story.variants.some((vt) => vt.name === variant)
  return { storyId, variant: matched ? variant! : story.variants[0].name }
}

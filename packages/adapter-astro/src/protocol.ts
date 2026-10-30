/**
 * The contract between the adapter (in binbook's process) and the integration
 * (in `astro dev`'s process).
 */

/** Middleware the adapter POSTs a {@link RenderRequest} to. */
export const RENDER_PATH = '/_binbook/render'

/** Injected page the middleware forwards each render to, so Astro's own pipeline renders it. */
export const FRAME_PATH = '/_binbook/frame'

/** Header carrying the per-process token the frame page requires, so only the middleware can reach it. */
export const TOKEN_HEADER = 'x-binbook-token'

export interface RenderRequest {
  /** Absolute path to the component, optionally followed by `#export`. */
  component: string
  props: Record<string, unknown>
  /** Absolute decorator refs, outermost first, each optionally followed by `#export`. */
  decorators: string[]
}

export interface RenderResponse {
  html?: string
  /** Root-relative URLs of every stylesheet the component and its decorators import. */
  styles?: string[]
  error?: string
}

/** The file part of a `<file>#<export>` ref. */
export function fileOf(ref: string): string {
  const hash = ref.indexOf('#')
  return hash === -1 ? ref : ref.slice(0, hash)
}

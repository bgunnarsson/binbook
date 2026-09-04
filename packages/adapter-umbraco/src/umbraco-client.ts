import type { UmbracoBlockRef, UmbracoContentRef } from '@bgunnarsson/binbook-types'

/** Payload POSTed to the consumer site's dev render endpoint. */
export interface UmbracoRenderRequest {
  /** Site-relative view path, e.g. "~/Views/Partials/Blocks/Hero.cshtml". */
  view: string
  /** The content node the partial renders against. */
  content: UmbracoContentRef
  /** Extra values layered over the model as ViewData. */
  args: Record<string, unknown>
  /**
   * When set, render a Block List block out of `content`'s block-list property
   * instead of rendering `view` against the node. With `block.type` the endpoint
   * renders that one block's view; without it, the whole list in order.
   */
  block?: UmbracoBlockRef
}

/** One block enumerated from a showcase node's block-list property. */
export interface UmbracoBlock {
  /** Content-type alias of the block, e.g. "heroBlock" — the story selector. */
  alias: string
  /** Human-friendly name (content-type name), for the sidebar title. */
  name: string
}

interface UmbracoRenderResponse {
  html?: string
  source?: string
  blocks?: UmbracoBlock[]
  error?: string
}

function requireEndpoint(endpoint: string | undefined): string {
  if (!endpoint) {
    throw new Error(
      'umbraco: a story uses `mode: "umbraco"` but no `umbracoEndpoint` is configured. ' +
        'Pass it to the adapter, e.g. umbraco({ umbracoEndpoint: "https://localhost:44300/binbook/render" }).'
    )
  }
  return endpoint
}

async function post(endpoint: string, body: unknown, headers?: Record<string, string>): Promise<UmbracoRenderResponse> {
  let res: Response
  try {
    res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        // Extra headers the endpoint may require to authenticate this Node
        // adapter — e.g. a shared dev secret (`X-Binbook-Secret`) — since it has
        // no browser session (see `headers` in UmbracoOptions).
        ...(headers ?? {}),
      },
      body: JSON.stringify(body),
    })
  } catch (err) {
    throw new Error(
      `umbraco: could not reach the Umbraco render endpoint at ${endpoint}. ` +
        `Is the site running? (${(err as Error).message})`
    )
  }
  const text = await res.text()
  let data: UmbracoRenderResponse = {}
  if (text) {
    try {
      data = JSON.parse(text) as UmbracoRenderResponse
    } catch {
      // Non-JSON body (e.g. an ASP.NET error page); surface it as the error.
      if (!res.ok) {
        throw new Error(`umbraco: Umbraco render failed (${res.status}): ${text.slice(0, 500)}`)
      }
    }
  }
  if (res.status === 401 || res.status === 403) {
    throw new Error(
      `umbraco: the render endpoint rejected the request (${res.status}) — it requires an ` +
        "auth header. Configure the adapter's `headers` (e.g. an `X-Binbook-Secret` shared " +
        "dev secret matching the site's config) so the request is authenticated."
    )
  }
  if (!res.ok || data.error) {
    throw new Error(`umbraco: Umbraco render failed (${res.status}): ${data.error ?? res.statusText}`)
  }
  return data
}

/** Render a partial inside the live Umbraco site, returning its HTML. */
export async function renderUmbraco(
  endpoint: string | undefined,
  req: UmbracoRenderRequest,
  headers?: Record<string, string>
): Promise<string> {
  const data = await post(requireEndpoint(endpoint), req, headers)
  return data.html ?? ''
}

/**
 * Enumerate the blocks of a content node's block-list property, so the adapter
 * can expand a `blockList` manifest into one story per block type.
 */
export async function listUmbracoBlocks(
  endpoint: string | undefined,
  content: UmbracoContentRef,
  property: string,
  headers?: Record<string, string>
): Promise<UmbracoBlock[]> {
  const data = await post(requireEndpoint(endpoint), { list: true, content, property }, headers)
  return data.blocks ?? []
}

/** Fetch a view's raw source from the endpoint for the docs panel (best-effort). */
export async function umbracoSource(
  endpoint: string | undefined,
  view: string,
  headers?: Record<string, string>
): Promise<string | undefined> {
  const data = await post(requireEndpoint(endpoint), { view, source: true }, headers)
  return data.source
}

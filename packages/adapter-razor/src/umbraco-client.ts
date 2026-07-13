import type { RazorContentRef } from "@bgunnarsson/binbook-types";

/** Payload POSTed to the consumer site's dev render endpoint. */
export interface UmbracoRenderRequest {
  /** Site-relative view path, e.g. "~/Views/Partials/Blocks/Hero.cshtml". */
  view: string;
  /** The content node the partial renders against. */
  content: RazorContentRef;
  /** Extra values layered over the model as ViewData. */
  args: Record<string, unknown>;
}

interface UmbracoRenderResponse {
  html?: string;
  source?: string;
  error?: string;
}

function requireEndpoint(endpoint: string | undefined): string {
  if (!endpoint) {
    throw new Error(
      "razor: a story uses `mode: \"umbraco\"` but no `umbracoEndpoint` is configured. " +
        "Pass it to the adapter, e.g. razor({ umbracoEndpoint: \"https://localhost:44300/binbook/render\" }).",
    );
  }
  return endpoint;
}

async function post(endpoint: string, body: unknown): Promise<UmbracoRenderResponse> {
  let res: Response;
  try {
    res = await fetch(endpoint, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    throw new Error(
      `razor: could not reach the Umbraco render endpoint at ${endpoint}. ` +
        `Is the site running? (${(err as Error).message})`,
    );
  }
  const text = await res.text();
  let data: UmbracoRenderResponse = {};
  if (text) {
    try {
      data = JSON.parse(text) as UmbracoRenderResponse;
    } catch {
      // Non-JSON body (e.g. an ASP.NET error page); surface it as the error.
      if (!res.ok) throw new Error(`razor: Umbraco render failed (${res.status}): ${text.slice(0, 500)}`);
    }
  }
  if (!res.ok || data.error) {
    throw new Error(`razor: Umbraco render failed (${res.status}): ${data.error ?? res.statusText}`);
  }
  return data;
}

/** Render a partial inside the live Umbraco site, returning its HTML. */
export async function renderUmbraco(
  endpoint: string | undefined,
  req: UmbracoRenderRequest,
): Promise<string> {
  const data = await post(requireEndpoint(endpoint), req);
  return data.html ?? "";
}

/** Fetch a view's raw source from the endpoint for the docs panel (best-effort). */
export async function umbracoSource(
  endpoint: string | undefined,
  view: string,
): Promise<string | undefined> {
  const data = await post(requireEndpoint(endpoint), { view, source: true });
  return data.source;
}

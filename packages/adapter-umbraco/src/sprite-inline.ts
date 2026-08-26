/**
 * Inline external SVG sprite symbols into rendered markup.
 *
 * `umbraco`-mode markup references the live site's icon sprite by URL, e.g.
 * `<use href="/build-hverslun/icons.svg#cart">`. That renders on the real site,
 * but binbook's canvas is a `sandbox="allow-scripts"` iframe with an opaque
 * origin, and browsers block **cross-origin** SVG `<use>` even with a `<base>` —
 * so the glyphs silently disappear. A `<base href>` fixes `<img>`/`<link>` but
 * not sprite `<use>` (a same-origin-policy rule, not a binbook one).
 *
 * The fix: fetch the sprite server-side (Node has no such restriction), inline
 * the referenced `<symbol>`s once into the document, and rewrite each external
 * `<use href="….svg#id">` to a same-document `<use href="#id">`. Now the glyphs
 * resolve inside the canvas. Best-effort throughout: any ref we can't resolve is
 * left exactly as-is.
 */

/** Fetches a sprite's raw SVG text, or null when it can't be retrieved. */
export type SpriteFetcher = (url: string) => Promise<string | null>;

export interface InlineSpritesOptions {
  /** Origin used to resolve root-relative sprite URLs (the live site's origin). */
  origin: string;
  fetch: SpriteFetcher;
  /** Cross-render cache of fetched sprite text, keyed by absolute URL. */
  cache?: Map<string, string | null>;
}

// <use ... href="<file>.svg#<id>" ...> — captures the sprite URL and symbol id.
// Handles both `href` and legacy `xlink:href`, single or double quotes.
const USE_RE = /<use\b[^>]*?\b(?:xlink:href|href)\s*=\s*(["'])([^"'#]+\.svg)#([^"']+)\1[^>]*>/gi;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Resolve a sprite URL against the site origin. Returns null if unresolvable. */
function absoluteUrl(url: string, origin: string): string | null {
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith("/")) return origin + url;
  return null; // relative paths have no reliable base here — skip.
}

/** Extract a single `<symbol id="…">…</symbol>` block by id, or null. */
function extractSymbol(spriteSvg: string, id: string): string | null {
  const re = new RegExp(`<symbol\\b[^>]*\\bid=(["'])${escapeRegExp(id)}\\1[\\s\\S]*?</symbol>`, "i");
  return spriteSvg.match(re)?.[0] ?? null;
}

export async function inlineSprites(html: string, opts: InlineSpritesOptions): Promise<string> {
  // 1) Collect every (spriteUrl, id) pair referenced in the markup.
  const refs = new Map<string, Set<string>>(); // absolute sprite URL -> ids
  for (const m of html.matchAll(USE_RE)) {
    const abs = absoluteUrl(m[2], opts.origin);
    if (!abs) continue;
    (refs.get(abs) ?? refs.set(abs, new Set()).get(abs)!).add(m[3]);
  }
  if (refs.size === 0) return html;

  // 2) Fetch each sprite once and pull out the referenced symbols.
  const cache = opts.cache;
  const symbols: string[] = [];
  const inlinedIds = new Set<string>(); // ids we successfully inlined
  for (const [url, ids] of refs) {
    let svg = cache?.get(url) ?? null;
    if (svg === null && !cache?.has(url)) {
      svg = await opts.fetch(url);
      cache?.set(url, svg);
    }
    if (!svg) continue;
    for (const id of ids) {
      if (inlinedIds.has(id)) continue;
      const sym = extractSymbol(svg, id);
      if (sym) {
        symbols.push(sym);
        inlinedIds.add(id);
      }
    }
  }
  if (symbols.length === 0) return html;

  // 3) Rewrite external refs for the ids we inlined → same-document fragments.
  const rewritten = html.replace(USE_RE, (whole, _quote, url, id) =>
    inlinedIds.has(id) ? whole.replace(`${url}#${id}`, `#${id}`) : whole,
  );

  // 4) Prepend a hidden <svg> holding the inlined symbols so the fragments resolve.
  const defs = `<svg xmlns="http://www.w3.org/2000/svg" style="position:absolute;width:0;height:0;overflow:hidden" aria-hidden="true">${symbols.join("")}</svg>`;
  return defs + rewritten;
}

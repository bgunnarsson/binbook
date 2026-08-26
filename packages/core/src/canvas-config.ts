import path from "node:path";
import type { BinbookConfig, CanvasConfig } from "@bgunnarsson/binbook-types";

/**
 * Resolve viewer-facing canvas settings from the project config.
 *
 * `styles` become `/__binbook_style/<index>` URLs served verbatim by the dev
 * server (see `binbookServer`), and the viewer loads them as absolute-origin
 * `<link>`s inside the sandboxed canvas iframe. Because that iframe is a
 * separate document, the project CSS can never touch the viewer's own styles —
 * and vice versa.
 *
 * We deliberately do NOT use Vite's `/@fs/` route: Vite runs its CSS transform
 * (PostCSS + the viewer's own Tailwind) on any `.css` it serves, which would
 * re-process an already-built brand stylesheet and fail (e.g. a Tailwind v4
 * build hitting the viewer's v3 PostCSS plugin). The raw route bypasses that.
 */
export function resolveCanvasConfig(config: BinbookConfig): CanvasConfig {
  // The `.css` suffix matters: the viewer picks `<link rel="stylesheet">` vs
  // `<script>` by extension, so an extensionless URL would be loaded as a module
  // script (and CORS-fail). The suffix is cosmetic to the server route, which
  // keys off the numeric index.
  const styles = (config.styles ?? []).map((_, i) => `/__binbook_style/${i}.css`);
  // Each script's *directory* is served under `/__binbook_script/<i>/`, and the
  // entry is loaded by its basename — so the entry's relative chunk imports
  // (`./chunk-abc.js`) resolve to siblings in the same served directory. The
  // route sends `Access-Control-Allow-Origin: *` so these modules load into the
  // sandboxed, opaque-origin canvas (a cross-origin, credential-less fetch).
  const scripts = (config.scripts ?? []).map(
    (p, i) => `/__binbook_script/${i}/${path.basename(p)}`,
  );
  return { background: config.background ?? "#ffffff", styles, scripts };
}

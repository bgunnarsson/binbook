import path from "node:path";
import type { BinbookConfig, CanvasConfig } from "@bgunnarsson/binbook-types";

/**
 * Resolve viewer-facing canvas settings from the project config.
 *
 * `styles` become Vite `/@fs/<abs>` URLs: the dev server serves the file from
 * anywhere on disk (subject to `server.fs.allow`), and the viewer loads them as
 * absolute-origin `<link>`s inside the sandboxed canvas iframe. Because that
 * iframe is a separate document, the project CSS can never touch the viewer's
 * own styles — and vice versa.
 */
export function resolveCanvasConfig(config: BinbookConfig, root: string): CanvasConfig {
  const styles = (config.styles ?? []).map((entry) => {
    const abs = path.resolve(root, entry).replace(/\\/g, "/");
    return "/@fs/" + abs.replace(/^\//, "");
  });
  return { background: config.background ?? "#ffffff", styles };
}

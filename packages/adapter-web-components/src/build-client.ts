import { statSync } from "node:fs";
import { build } from "esbuild";

// The bundle depends only on the component file (args arrive as attributes in
// the markup, not here), so cache by entry-file mtime — arg edits re-render but
// don't touch the file, and shouldn't re-run esbuild.
const cache = new Map<string, { mtimeMs: number; code: string }>();

/**
 * Bundles a custom-element module into a self-contained IIFE for the sandboxed
 * canvas. The bundle's side effect — `customElements.define(...)`, directly or
 * via Lit's `@customElement` — upgrades the story's element tag on load. Any
 * framework the component imports (e.g. Lit) is bundled in, since the iframe has
 * no module system.
 */
export async function buildClientBundle(absComponent: string): Promise<string> {
  let mtimeMs = 0;
  try {
    mtimeMs = statSync(absComponent).mtimeMs;
  } catch {
    /* fall through and always rebuild */
  }
  const hit = cache.get(absComponent);
  if (hit && mtimeMs && hit.mtimeMs === mtimeMs) { return hit.code; }

  const result = await build({
    entryPoints: [absComponent],
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    // Lit's common setup uses legacy (`experimentalDecorators`) decorators for
    // `@customElement` / `@property`; this makes them compile without a project
    // tsconfig. Vanilla components are unaffected.
    tsconfigRaw: { compilerOptions: { experimentalDecorators: true, useDefineForClassFields: false } },
    loader: { ".css": "empty", ".scss": "empty", ".svg": "empty", ".png": "empty", ".jpg": "empty" },
    logLevel: "silent",
  });

  const code = result.outputFiles[0].text;
  cache.set(absComponent, { mtimeMs, code });
  return code;
}

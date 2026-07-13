import { statSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";

/** The mount element the SSR markup is wrapped in and hydrated into. */
export const MOUNT_ID = "binbook-root";

// Bundling react-dom for the browser is the expensive part, and the output only
// depends on the component (args arrive at runtime via window.__BINBOOK_ARGS__).
// Cache by entry-file mtime so arg edits — which re-render but don't touch the
// file — reuse the bundle instead of re-running esbuild on every keystroke.
const cache = new Map<string, { mtimeMs: number; code: string }>();

/**
 * Bundles a self-contained IIFE that hydrates the server-rendered markup with
 * `react-dom/client`, reading its props from `window.__BINBOOK_ARGS__`.
 *
 * Unlike the SSR bundle (which keeps react external and runs in Node), this one
 * bundles react + react-dom IN, since the sandboxed iframe has no module system.
 */
export async function buildClientBundle(absComponent: string, exportName?: string): Promise<string> {
  const name = exportName ?? "default";
  const key = `${absComponent}#${name}`;
  let mtimeMs = 0;
  try {
    mtimeMs = statSync(absComponent).mtimeMs;
  } catch {
    /* file may be virtual in tests; fall through and always rebuild */
  }
  const hit = cache.get(key);
  if (hit && mtimeMs && hit.mtimeMs === mtimeMs) return hit.code;

  const entry =
    `import * as mod from ${JSON.stringify(absComponent)};\n` +
    `import { createElement } from "react";\n` +
    `import { hydrateRoot } from "react-dom/client";\n` +
    `var C = mod[${JSON.stringify(name)}] || mod.default;\n` +
    `var el = document.getElementById(${JSON.stringify(MOUNT_ID)});\n` +
    `if (el && C) hydrateRoot(el, createElement(C, (window.__BINBOOK_ARGS__ || {})));\n`;

  const result = await build({
    stdin: { contents: entry, resolveDir: path.dirname(absComponent), loader: "js" },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    jsx: "automatic",
    jsxImportSource: "react",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    // Non-JS asset imports don't affect markup/behavior here; canvas CSS is
    // injected separately via config `styles`.
    loader: { ".css": "empty", ".scss": "empty", ".svg": "empty", ".png": "empty", ".jpg": "empty" },
    logLevel: "silent",
  });

  const code = result.outputFiles[0].text;
  cache.set(key, { mtimeMs, code });
  return code;
}

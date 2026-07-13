import { statSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { sveltePlugin } from "./svelte-plugin";

/** The mount element the SSR markup is wrapped in and hydrated into. */
export const MOUNT_ID = "binbook-root";

// The client bundle depends only on the component (props arrive at runtime via
// window.__BINBOOK_ARGS__), so cache it by entry-file mtime — arg edits re-render
// but don't touch the file, and shouldn't re-run the Svelte compiler + esbuild.
const cache = new Map<string, { mtimeMs: number; code: string }>();

/**
 * Bundles a self-contained IIFE that hydrates the server-rendered markup with
 * Svelte's client runtime (bundled in, since the sandboxed iframe has no module
 * system), reading props from `window.__BINBOOK_ARGS__`.
 */
export async function buildClientBundle(absComponent: string): Promise<string> {
  let mtimeMs = 0;
  try {
    mtimeMs = statSync(absComponent).mtimeMs;
  } catch {
    /* fall through and always rebuild */
  }
  const hit = cache.get(absComponent);
  if (hit && mtimeMs && hit.mtimeMs === mtimeMs) return hit.code;

  const entry =
    `import Component from ${JSON.stringify(absComponent)};\n` +
    `import { hydrate } from "svelte";\n` +
    `var el = document.getElementById(${JSON.stringify(MOUNT_ID)});\n` +
    `if (el) hydrate(Component, { target: el, props: (window.__BINBOOK_ARGS__ || {}) });\n`;

  const result = await build({
    stdin: { contents: entry, resolveDir: path.dirname(absComponent), loader: "js" },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    minify: true,
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [sveltePlugin("client")],
    logLevel: "silent",
  });

  const code = result.outputFiles[0].text;
  cache.set(absComponent, { mtimeMs, code });
  return code;
}

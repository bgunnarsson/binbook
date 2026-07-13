import { statSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { vuePlugin, VUE_FLAGS } from "./vue-plugin";

/** The mount element the SSR markup is wrapped in and hydrated into. */
export const MOUNT_ID = "binbook-root";

// The client bundle depends only on the component (props arrive at runtime via
// window.__BINBOOK_ARGS__), so cache it by entry-file mtime.
const cache = new Map<string, { mtimeMs: number; code: string }>();

/**
 * Bundles a self-contained IIFE that hydrates the server-rendered markup with
 * Vue's client runtime (bundled in). `createSSRApp(...).mount(el)` hydrates the
 * existing SSR DOM in place; props come from `window.__BINBOOK_ARGS__`.
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
    `import { createSSRApp } from "vue";\n` +
    `var el = document.getElementById(${JSON.stringify(MOUNT_ID)});\n` +
    `if (el) createSSRApp(Component, (window.__BINBOOK_ARGS__ || {})).mount(el);\n`;

  const result = await build({
    stdin: { contents: entry, resolveDir: path.dirname(absComponent), loader: "js" },
    bundle: true,
    write: false,
    format: "iife",
    platform: "browser",
    minify: true,
    define: VUE_FLAGS,
    plugins: [vuePlugin(false)],
    logLevel: "silent",
  });

  const code = result.outputFiles[0].text;
  cache.set(absComponent, { mtimeMs, code });
  return code;
}

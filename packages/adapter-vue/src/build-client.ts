import { statSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { vuePlugin, VUE_FLAGS } from "./vue-plugin";

/** The mount element the SSR markup is wrapped in and hydrated into. */
export const MOUNT_ID = "binbook-root";

/** Decorator refs are already absolute (core-resolved); drop any `#export`. */
export function decoratorFile(ref: string): string {
  const hash = ref.indexOf("#");
  return hash === -1 ? ref : ref.slice(0, hash);
}

// The bundle depends on the component + its decorators (props arrive at runtime
// via window.__BINBOOK_ARGS__), so cache by their combined identity and mtimes.
const cache = new Map<string, { mtimeMs: number; code: string }>();

function mtime(file: string): number {
  try {
    return statSync(file).mtimeMs;
  } catch {
    return 0;
  }
}

/**
 * Bundles a self-contained IIFE that hydrates the server-rendered markup with
 * Vue's client runtime (bundled in). `createSSRApp(...).mount(el)` hydrates in
 * place; props come from `window.__BINBOOK_ARGS__`. Decorators (absolute refs,
 * outermost first) are composed with `h()` exactly as on the server.
 */
export async function buildClientBundle(absComponent: string, decorators: string[] = []): Promise<string> {
  const decFiles = decorators.map(decoratorFile);
  const key = `${absComponent}|${decorators.join(",")}`;
  const newest = Math.max(mtime(absComponent), ...decFiles.map(mtime), 0);
  const hit = cache.get(key);
  if (hit && newest && hit.mtimeMs === newest) return hit.code;

  let entry: string;
  if (decFiles.length === 0) {
    entry =
      `import Component from ${JSON.stringify(absComponent)};\n` +
      `import { createSSRApp } from "vue";\n` +
      `var el = document.getElementById(${JSON.stringify(MOUNT_ID)});\n` +
      `if (el) createSSRApp(Component, (window.__BINBOOK_ARGS__ || {})).mount(el);\n`;
  } else {
    const imports = decFiles.map((f, i) => `import __d${i} from ${JSON.stringify(f)};`).join("\n");
    const list = decFiles.map((_, i) => `__d${i}`).join(", ");
    entry =
      `import Story from ${JSON.stringify(absComponent)};\n` +
      imports +
      `\nimport { createSSRApp, h } from "vue";\n` +
      `var args = window.__BINBOOK_ARGS__ || {};\n` +
      `var decs = [${list}];\n` +
      `var Root = { render: function () { return decs.reduceRight(function (child, Dec) { return h(Dec, null, { default: function () { return child; } }); }, h(Story, args)); } };\n` +
      `var el = document.getElementById(${JSON.stringify(MOUNT_ID)});\n` +
      `if (el) createSSRApp(Root).mount(el);\n`;
  }

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
  cache.set(key, { mtimeMs: newest, code });
  return code;
}

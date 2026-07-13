import { statSync } from "node:fs";
import path from "node:path";
import { build } from "esbuild";
import { parseComponentRef } from "./load-component";

/** The mount element the SSR markup is wrapped in and hydrated into. */
export const MOUNT_ID = "binbook-root";

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
 * `react-dom/client`, reading props from `window.__BINBOOK_ARGS__`. The
 * component is wrapped in `decorators` (absolute `<file>#<export>` refs, outermost
 * first) in the same order as the SSR render, so the two markups match.
 */
export async function buildClientBundle(
  absComponent: string,
  exportName: string | undefined,
  decorators: string[] = [],
): Promise<string> {
  const decs = decorators.map((ref) => parseComponentRef(ref));
  const key = `${absComponent}#${exportName ?? "default"}|${decorators.join(",")}`;
  const newest = Math.max(mtime(absComponent), ...decs.map((d) => mtime(d.file)), 0);
  const hit = cache.get(key);
  if (hit && newest && hit.mtimeMs === newest) return hit.code;

  const decImports = decs.map((d, i) => `import * as __d${i} from ${JSON.stringify(d.file)};`).join("\n");
  const decList = decs.map((d, i) => `__d${i}[${JSON.stringify(d.exportName ?? "default")}] || __d${i}.default`);

  const entry =
    `import * as __c from ${JSON.stringify(absComponent)};\n` +
    decImports +
    `\nimport { createElement } from "react";\n` +
    `import { hydrateRoot } from "react-dom/client";\n` +
    `var C = __c[${JSON.stringify(exportName ?? "default")}] || __c.default;\n` +
    `var el = createElement(C, (window.__BINBOOK_ARGS__ || {}));\n` +
    `var decs = [${decList.join(", ")}];\n` +
    `for (var i = decs.length - 1; i >= 0; i--) el = createElement(decs[i], {}, el);\n` +
    `var mount = document.getElementById(${JSON.stringify(MOUNT_ID)});\n` +
    `if (mount) hydrateRoot(mount, el);\n`;

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
    loader: { ".css": "empty", ".scss": "empty", ".svg": "empty", ".png": "empty", ".jpg": "empty" },
    logLevel: "silent",
  });

  const code = result.outputFiles[0].text;
  cache.set(key, { mtimeMs: newest, code });
  return code;
}

import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { writeFile, rename, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import type { ComponentType } from "react";
import { build } from "esbuild";

/** A component ref is `<file>` or `<file>#<exportName>`. */
export function parseComponentRef(ref: string): { file: string; exportName?: string } {
  const hash = ref.indexOf("#");
  if (hash === -1) { return { file: ref }; }
  return { file: ref.slice(0, hash), exportName: ref.slice(hash + 1) || undefined };
}

// The whole point of this adapter is loading a component whose props it
// cannot know. `ComponentType<unknown>` is stricter than any real component
// satisfies, so `any` here is React's own spelling for "any props".
// biome-ignore lint/suspicious/noExplicitAny: a component of unknown props
function pickExport(mod: Record<string, unknown>, exportName: string | undefined, file: string): ComponentType<any> {
  const name = exportName ?? "default";
  const value = mod[name];
  if (typeof value !== "function") {
    throw new Error(`React adapter: export "${name}" in ${file} is not a component`);
  }
  // biome-ignore lint/suspicious/noExplicitAny: a component of unknown props
  return value as ComponentType<any>;
}

/**
 * Directory for compiled bundles: the `.binbook-react` folder inside the nearest
 * ancestor `node_modules`. That keeps the artifacts out of the user's source
 * tree (node_modules is already git-ignored) while still resolving bare imports
 * like `react` against the same install the component would use.
 */
function bundleDir(file: string): string {
  let dir = path.dirname(file);
  for (;;) {
    if (existsSync(path.join(dir, "node_modules"))) { return path.join(dir, "node_modules", ".binbook-react"); }
    const parent = path.dirname(dir);
    if (parent === dir) { return path.join(path.dirname(file), ".binbook-react"); } // fallback
    dir = parent;
  }
}

let counter = 0;

/**
 * Bundles a component (JSX/TSX + relative imports) to ESM and imports it in Node.
 *
 * `react`/`react-dom` are left external so the component and the adapter's
 * `react-dom/server` share ONE React instance — otherwise hooks throw during
 * SSR. Non-JS asset imports (css, images) are dropped; SSR only needs markup.
 */
// biome-ignore lint/suspicious/noExplicitAny: a component of unknown props
export async function loadComponent(file: string, exportName: string | undefined): Promise<ComponentType<any>> {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    packages: "external",
    jsx: "automatic",
    jsxImportSource: "react",
    loader: { ".css": "empty", ".scss": "empty", ".svg": "empty", ".png": "empty", ".jpg": "empty" },
    logLevel: "silent",
  });

  const code = result.outputFiles[0].text;
  // Content hash: identical bundles reuse one module URL (Node never evicts the
  // ESM cache); an edit yields a new hash. The file is written once and left in
  // place — deleting it would race concurrent imports of the same component.
  const hash = createHash("sha1").update(code).digest("hex").slice(0, 16);
  const dir = bundleDir(file);
  const target = path.join(dir, `${hash}.mjs`);

  if (!existsSync(target)) {
    await mkdir(dir, { recursive: true });
    // Write to a unique temp name then atomically rename, so a concurrent import
    // never observes a half-written file.
    const staging = path.join(dir, `.${hash}.${process.pid}.${counter++}.tmp`);
    await writeFile(staging, code, "utf8");
    try {
      await rename(staging, target);
    } catch {
      await unlink(staging).catch(() => {});
    }
  }

  const mod = (await import(pathToFileURL(target).href)) as Record<string, unknown>;
  return pickExport(mod, exportName, file);
}

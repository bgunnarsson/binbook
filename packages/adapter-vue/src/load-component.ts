import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { writeFile, rename, mkdir, unlink } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { build } from "esbuild";
import { vuePlugin, VUE_FLAGS } from "./vue-plugin";

function bundleDir(file: string): string {
  let dir = path.dirname(file);
  for (;;) {
    if (existsSync(path.join(dir, "node_modules"))) return path.join(dir, "node_modules", ".binbook-vue");
    const parent = path.dirname(dir);
    if (parent === dir) return path.join(path.dirname(file), ".binbook-vue");
    dir = parent;
  }
}

let counter = 0;

export interface LoadedComponent {
  component: unknown;
  /** Compiled CSS to inject into the SSR markup. */
  css: string;
}

/**
 * Compiles a `.vue` SFC (+ its relative imports) to an SSR ESM module and
 * imports it in Node. Vue is left external so the compiled output and the
 * adapter's `vue/server-renderer` share one runtime instance.
 */
export async function loadServerComponent(file: string): Promise<LoadedComponent> {
  const css: string[] = [];
  const result = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: "esm",
    platform: "node",
    packages: "external",
    plugins: [vuePlugin(true, css)],
    define: VUE_FLAGS,
    logLevel: "silent",
  });

  const code = result.outputFiles[0].text;
  const hash = createHash("sha1").update(code).digest("hex").slice(0, 16);
  const dir = bundleDir(file);
  const target = path.join(dir, `${hash}.mjs`);

  if (!existsSync(target)) {
    await mkdir(dir, { recursive: true });
    const staging = path.join(dir, `.${hash}.${process.pid}.${counter++}.tmp`);
    await writeFile(staging, code, "utf8");
    try {
      await rename(staging, target);
    } catch {
      await unlink(staging).catch(() => {});
    }
  }

  const mod = (await import(pathToFileURL(target).href)) as { default?: unknown };
  if (!mod.default) throw new Error(`Vue adapter: ${file} has no default component export`);
  return { component: mod.default, css: css.join("") };
}

import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { writeFile, rename, mkdir, unlink } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { build } from 'esbuild'
import { sveltePlugin } from './svelte-plugin'

/**
 * Compiled-bundle cache dir: `.binbook-svelte` inside the nearest ancestor
 * `node_modules` (already git-ignored), so bare imports like `svelte/internal`
 * resolve against the same install the component uses.
 */
export function bundleDir(file: string): string {
  let dir = path.dirname(file)
  for (;;) {
    if (existsSync(path.join(dir, 'node_modules'))) {
      return path.join(dir, 'node_modules', '.binbook-svelte')
    }
    const parent = path.dirname(dir)
    if (parent === dir) {
      return path.join(path.dirname(file), '.binbook-svelte')
    }
    dir = parent
  }
}

let counter = 0

/**
 * Compiles a `.svelte` component (+ its relative imports) to an SSR ESM module
 * and imports it in Node. Svelte itself is left external so the compiled output
 * and the adapter's `svelte/server` share one runtime instance.
 */
export async function loadServerComponent(file: string): Promise<unknown> {
  const result = await build({
    entryPoints: [file],
    bundle: true,
    write: false,
    format: 'esm',
    platform: 'node',
    packages: 'external',
    plugins: [sveltePlugin('server')],
    logLevel: 'silent',
  })

  const code = result.outputFiles[0].text
  // Content-hash so identical bundles reuse one module URL (Node never evicts
  // the ESM cache); an edit yields a new hash. Written once, then left in place.
  const hash = createHash('sha1').update(code).digest('hex').slice(0, 16)
  const dir = bundleDir(file)
  const target = path.join(dir, `${hash}.mjs`)

  if (!existsSync(target)) {
    await mkdir(dir, { recursive: true })
    const staging = path.join(dir, `.${hash}.${process.pid}.${counter++}.tmp`)
    await writeFile(staging, code, 'utf8')
    try {
      await rename(staging, target)
    } catch {
      await unlink(staging).catch(() => {})
    }
  }

  const mod = (await import(pathToFileURL(target).href)) as { default?: unknown }
  if (typeof mod.default !== 'function') {
    throw new Error(`Svelte adapter: ${file} has no default component export`)
  }
  return mod.default
}

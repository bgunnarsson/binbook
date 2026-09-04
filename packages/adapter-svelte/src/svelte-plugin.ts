import { readFile } from 'node:fs/promises'
import type { Plugin } from 'esbuild'

/**
 * esbuild plugin that compiles `.svelte` files with the Svelte compiler.
 *
 * `generate: "server"` produces the SSR module (run in Node to get markup);
 * `generate: "client"` produces the browser module that hydrates it. `css:
 * "injected"` folds component styles into the JS, so the server output carries
 * them in `head` and the client re-injects them on mount — no separate .css to
 * thread through the sandbox.
 */
export function sveltePlugin(generate: 'server' | 'client'): Plugin {
  let compile: ((source: string, options: Record<string, unknown>) => { js: { code: string } }) | undefined
  return {
    name: 'binbook-svelte',
    setup(build) {
      build.onLoad({ filter: /\.svelte$/ }, async (args) => {
        if (!compile) {
          // biome-ignore lint/suspicious/noExplicitAny: an optional peer with no types at build time
          ;({ compile } = (await import('svelte/compiler')) as any)
        }
        const source = await readFile(args.path, 'utf8')
        const { js } = compile!(source, { generate, css: 'injected', filename: args.path })
        return { contents: js.code, loader: 'js' }
      })
    },
  }
}

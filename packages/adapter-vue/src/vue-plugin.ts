import { readFile } from 'node:fs/promises'
import type { Plugin } from 'esbuild'
import { compileSfc } from './compile-sfc'

/**
 * esbuild plugin that compiles `.vue` SFCs. `ssr` picks the SSR vs client render
 * function. When `cssOut` is provided, each component's compiled CSS is pushed
 * to it so the SSR path can inject a single `<style>` into the story markup.
 */
export function vuePlugin(ssr: boolean, cssOut?: string[]): Plugin {
  return {
    name: 'binbook-vue',
    setup(build) {
      build.onLoad({ filter: /\.vue$/ }, async (args) => {
        const source = await readFile(args.path, 'utf8')
        const { code, css } = compileSfc(source, args.path, { ssr })
        if (css && cssOut) {
          cssOut.push(css)
        }
        return { contents: code, loader: 'ts' }
      })
    },
  }
}

// Vue's ESM-bundler build reads these compile-time feature flags; define them so
// there are no "flag not defined" warnings and dead code is dropped.
export const VUE_FLAGS: Record<string, string> = {
  'process.env.NODE_ENV': '"production"',
  __VUE_OPTIONS_API__: 'true',
  __VUE_PROD_DEVTOOLS__: 'false',
  __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'false',
}

import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { bundleDir } from './load-component'

/** Decorator refs are absolute (core-resolved); drop any `#export`. */
function decoratorFile(ref: string): string {
  const hash = ref.indexOf('#')
  return hash === -1 ? ref : ref.slice(0, hash)
}

/**
 * Svelte components can't be composed at runtime, so decorator support is done
 * by codegen: write a wrapper SFC that nests the decorators around the story and
 * forwards props, then compile/hydrate that instead. Decorators render their
 * children via `{@render children()}`.
 *
 * Returns the wrapper's path (or the story path unchanged when there are none).
 * The wrapper imports by absolute path, so its own location doesn't matter; it
 * lives in the bundle cache dir. Content edits propagate because the downstream
 * bundle is content-hashed.
 */
export function wrapperFor(storyAbs: string, decorators: string[]): string {
  if (decorators.length === 0) {
    return storyAbs
  }

  const decFiles = decorators.map(decoratorFile)
  const key = createHash('sha1')
    .update([storyAbs, ...decorators].join('|'))
    .digest('hex')
    .slice(0, 16)
  const dir = bundleDir(storyAbs)
  const file = path.join(dir, `wrap-${key}.svelte`)

  if (!existsSync(file)) {
    mkdirSync(dir, { recursive: true })
    const imports = [
      `import Story from ${JSON.stringify(storyAbs)};`,
      ...decFiles.map((f, i) => `import Dec${i} from ${JSON.stringify(f)};`),
    ].join('\n')
    // decorators[0] outermost: <Dec0><Dec1><Story {...props} /></Dec1></Dec0>
    let inner = `<Story {...props} />`
    for (let i = decFiles.length - 1; i >= 0; i--) {
      inner = `<Dec${i}>${inner}</Dec${i}>`
    }
    const src = `<script>\n${imports}\nlet props = $props();\n</script>\n\n${inner}\n`
    writeFileSync(file, src, 'utf8')
  }
  return file
}

import path from 'node:path'
import type { RenderResult, Story } from '@bgunnarsson/binbook-types'
import type { AdapterRegistry } from './registry'
import { resolveArgs } from './resolve-args'

/**
 * Resolve a decorator ref (`<file>` or `<file>#<export>`) to an absolute ref,
 * keeping the `#export` suffix. `baseDir` is the story dir (per-story) or the
 * project root (global config).
 */
function resolveDecoratorRef(ref: string, baseDir: string): string {
  const hash = ref.indexOf('#')
  const file = hash === -1 ? ref : ref.slice(0, hash)
  const suffix = hash === -1 ? '' : ref.slice(hash)
  return path.resolve(baseDir, file) + suffix
}

export async function renderStory(
  registry: AdapterRegistry,
  story: Story,
  variantName: string,
  liveArgs: Record<string, unknown>,
  root: string,
  globalDecorators: string[] = []
): Promise<RenderResult> {
  const variant = story.variants.find((v) => v.name === variantName)
  if (!variant) {
    throw new Error(`Unknown variant "${variantName}" for story ${story.title}`)
  }
  const args = resolveArgs(story.args, variant.args, liveArgs)

  // Global decorators wrap outermost (resolved from root); the story's own wrap
  // inside them (resolved from the story file's dir).
  const storyDir = path.dirname(story.file)
  const decorators = [
    ...globalDecorators.map((ref) => resolveDecoratorRef(ref, root)),
    ...(story.decorators ?? []).map((ref) => resolveDecoratorRef(ref, storyDir)),
  ]

  const adapter = registry.forStory(story)
  return adapter.render({ story, component: story.component, args, root, decorators })
}

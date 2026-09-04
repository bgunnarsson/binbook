import type { Story } from '@bgunnarsson/binbook-types'
import type { AdapterRegistry } from './registry'

/**
 * Run each discovered story through its adapter's optional `expand` hook,
 * substituting the returned stories for the original (e.g. an Umbraco Block List
 * manifest → one story per block type + a full-list story). Stories whose
 * adapter has no `expand`, or which the hook leaves untouched, pass through.
 *
 * Kept separate from `discoverStories` so file discovery stays pure (no network)
 * and expansion — which may call a live site — is an explicit, fault-isolated
 * step: a hook that throws logs a warning and drops only its own manifest,
 * never the rest of the catalog.
 */
export async function expandStories(registry: AdapterRegistry, stories: Story[]): Promise<Story[]> {
  const out: Story[] = []
  for (const story of stories) {
    const adapter = registry.forStory(story)
    if (!adapter.expand) {
      out.push(story)
      continue
    }
    try {
      out.push(...(await adapter.expand(story)))
    } catch (err) {
      console.warn(`[binbook] could not expand ${story.title}: ${(err as Error).message}`)
    }
  }
  return out
}

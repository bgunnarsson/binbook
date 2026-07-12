import type { RenderResult, Story } from "@bgunnarsson/binbook-types";
import type { AdapterRegistry } from "./registry";
import { resolveArgs } from "./resolve-args";

export async function renderStory(
  registry: AdapterRegistry,
  story: Story,
  variantName: string,
  liveArgs: Record<string, unknown>,
  root: string,
): Promise<RenderResult> {
  const variant = story.variants.find((v) => v.name === variantName);
  if (!variant) throw new Error(`Unknown variant "${variantName}" for story ${story.title}`);
  const args = resolveArgs(story.args, variant.args, liveArgs);
  const adapter = registry.forStory(story);
  return adapter.render({ story, component: story.component, args, root });
}

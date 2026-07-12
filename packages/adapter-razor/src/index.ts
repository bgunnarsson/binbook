import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from "@bgunnarsson/binbook-types";
import { sharedHost } from "./host-client";

function resolveTemplate(story: Story, ref: string): string {
  // `component` is a .cshtml path relative to the story file's directory.
  return path.resolve(path.dirname(story.file), ref);
}

export function razor(): Adapter {
  return {
    name: "razor",
    storyGlob: "**/*.binbook.json",

    async render(ctx: RenderContext): Promise<RenderResult> {
      const template = resolveTemplate(ctx.story, ctx.component);
      const html = await sharedHost().render(template, ctx.args);
      return { html };
    },

    watch(story: Story, onChange: () => void) {
      const template = resolveTemplate(story, story.component);
      const templateWatcher = watch(template, () => onChange());
      const storyWatcher = watch(story.file, () => onChange());
      return () => {
        templateWatcher.close();
        storyWatcher.close();
      };
    },

    async docs(story: Story): Promise<DocsMeta> {
      const template = resolveTemplate(story, story.component);
      return { source: await readFile(template, "utf8") };
    },
  };
}

export default razor;

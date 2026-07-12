import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from "@bgunnarsson/binbook-types";
import { loadComponent, parseComponentRef } from "./load-component";

function resolveComponent(story: Story, ref: string): string {
  // ref is relative to the story file's directory
  return path.resolve(path.dirname(story.file), ref);
}

export function react(): Adapter {
  return {
    name: "react",
    storyGlob: "**/*.binbook.json",

    async render(ctx: RenderContext): Promise<RenderResult> {
      const { file, exportName } = parseComponentRef(ctx.component);
      const abs = resolveComponent(ctx.story, file);
      const Component = await loadComponent(abs, exportName);
      const html = renderToStaticMarkup(createElement(Component, { ...ctx.args }));
      return { html };
    },

    watch(story: Story, onChange: () => void) {
      const { file } = parseComponentRef(story.component);
      const abs = resolveComponent(story, file);
      const componentWatcher = watch(abs, () => onChange());
      const storyWatcher = watch(story.file, () => onChange());
      return () => {
        componentWatcher.close();
        storyWatcher.close();
      };
    },

    async docs(story: Story): Promise<DocsMeta> {
      const { file } = parseComponentRef(story.component);
      const abs = resolveComponent(story, file);
      return { source: await readFile(abs, "utf8") };
    },
  };
}

export default react;

import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import type { Adapter, DocsMeta, RenderContext, RenderResult, Story } from "@bgunnarsson/binbook-types";

/**
 * A template engine turns a template's source + the story's args into HTML.
 * Engines are thin wrappers around real template libraries (Handlebars,
 * Nunjucks, EJS, …) — see `./engines`. Bring your own by implementing this.
 */
export interface TemplateEngine {
  /** Display name, e.g. "handlebars". */
  name: string;
  /** File extensions this engine claims, lowercase with the dot (e.g. `.hbs`). */
  extensions: string[];
  /** Render `source` against `args`; `ctx` gives the resolved file + project root. */
  render(
    source: string,
    args: Record<string, unknown>,
    ctx: { file: string; root: string },
  ): string | Promise<string>;
}

export interface TemplatesAdapterOptions {
  /** One engine, or several — the component's file extension picks which runs. */
  engine: TemplateEngine | TemplateEngine[];
}

function componentPath(story: Story, component: string): string {
  // component is relative to the story file's directory
  return path.resolve(path.dirname(story.file), component);
}

function pickEngine(engines: TemplateEngine[], file: string): TemplateEngine {
  const ext = path.extname(file).toLowerCase();
  const match = engines.find((e) => e.extensions.some((x) => x.toLowerCase() === ext));
  if (match) return match;
  // A single registered engine renders anything; with several, the extension
  // must disambiguate.
  if (engines.length === 1) return engines[0];
  throw new Error(
    `templates adapter: no engine for "${ext}" (registered: ${engines.map((e) => e.name).join(", ") || "none"})`,
  );
}

/**
 * Renders template-engine components — the "templates family" adapter. One
 * adapter, a pluggable engine: `templates({ engine: handlebars() })`, or pass an
 * array to mix engines in one project and resolve by file extension.
 */
export function templates(options: TemplatesAdapterOptions): Adapter {
  const engines = Array.isArray(options.engine) ? options.engine : [options.engine];
  if (engines.length === 0) throw new Error("templates adapter: at least one engine is required");

  return {
    name: "templates",
    storyGlob: "**/*.binbook.json",

    async render(ctx: RenderContext): Promise<RenderResult> {
      const file = componentPath(ctx.story, ctx.component);
      const engine = pickEngine(engines, file);
      const source = await readFile(file, "utf8");
      const html = await engine.render(source, ctx.args, { file, root: ctx.root });
      return { html };
    },

    watch(story: Story, onChange: () => void) {
      const file = componentPath(story, story.component);
      const watcher = watch(file, () => onChange());
      const storyWatcher = watch(story.file, () => onChange());
      return () => {
        watcher.close();
        storyWatcher.close();
      };
    },

    async docs(story: Story): Promise<DocsMeta> {
      const file = componentPath(story, story.component);
      return { source: await readFile(file, "utf8") };
    },
  };
}

export { handlebars, nunjucks, ejs } from "./engines";
export default templates;

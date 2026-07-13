import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import type {
  Adapter,
  DocsMeta,
  RazorContentRef,
  RenderContext,
  RenderResult,
  Story,
} from "@bgunnarsson/binbook-types";
import { sharedHost } from "./host-client";
import { renderUmbraco, umbracoSource } from "./umbraco-client";

export interface RazorOptions {
  /**
   * Base URL of the consumer site's dev render endpoint (see the sample
   * `BinbookRenderController`), e.g. `"https://localhost:44300/binbook/render"`.
   * Required for any story that sets `razor.mode: "umbraco"`.
   */
  umbracoEndpoint?: string;
  /**
   * Absolute paths to compiled assemblies that expose Tag Helpers used by
   * `mvc`-mode `.cshtml` templates (e.g. the `vv-*` TagHelper library). They are
   * added to the embedded engine's compilation references and loaded at startup
   * so `@addTagHelper` directives resolve. Ignored in `umbraco` mode, where the
   * live site already has its own tag helpers registered.
   */
  tagHelperAssemblies?: string[];
}

function resolveTemplate(story: Story, ref: string): string {
  // In `mvc` mode `component` is a .cshtml path relative to the story file's dir.
  return path.resolve(path.dirname(story.file), ref);
}

function mode(story: Story): "mvc" | "umbraco" {
  return story.razor?.mode ?? "mvc";
}

function content(story: Story): RazorContentRef {
  return story.razor?.content ?? {};
}

/** The origin (scheme + host + port) of the render endpoint, e.g.
 * "https://localhost:44317/webapi/binbook/render" → "https://localhost:44317".
 * Undefined when no endpoint is configured or the URL can't be parsed. */
function endpointOrigin(endpoint: string | undefined): string | undefined {
  if (!endpoint) return undefined;
  try {
    return new URL(endpoint).origin;
  } catch {
    return undefined;
  }
}

export function razor(options: RazorOptions = {}): Adapter {
  return {
    name: "razor",
    storyGlob: "**/*.binbook.json",

    async render(ctx: RenderContext): Promise<RenderResult> {
      if (mode(ctx.story) === "umbraco") {
        // `component` is the site-relative view path, e.g. "~/Views/Partials/Hero.cshtml".
        const html = await renderUmbraco(options.umbracoEndpoint, {
          view: ctx.component,
          content: content(ctx.story),
          args: ctx.args,
        });
        // The markup references the live site's assets by root-relative path
        // (`/media/…`, `/build-…/…`). Resolve them against the site's origin so
        // they load inside the sandboxed canvas (opaque origin, no base of its own).
        return { html, baseHref: endpointOrigin(options.umbracoEndpoint) };
      }
      const template = resolveTemplate(ctx.story, ctx.component);
      const html = await sharedHost(options.tagHelperAssemblies).render(template, ctx.args);
      return { html };
    },

    watch(story: Story, onChange: () => void) {
      // In umbraco mode the view lives in the remote site; we can only watch the
      // story file itself (its content ref / args changing forces a re-render).
      if (mode(story) === "umbraco") {
        const storyWatcher = watch(story.file, () => onChange());
        return () => storyWatcher.close();
      }
      const template = resolveTemplate(story, story.component);
      const templateWatcher = watch(template, () => onChange());
      const storyWatcher = watch(story.file, () => onChange());
      return () => {
        templateWatcher.close();
        storyWatcher.close();
      };
    },

    async docs(story: Story): Promise<DocsMeta> {
      if (mode(story) === "umbraco") {
        // Best-effort: ask the endpoint for the view source; omit it if unavailable.
        const source = await umbracoSource(options.umbracoEndpoint, story.component).catch(() => undefined);
        return { source };
      }
      const template = resolveTemplate(story, story.component);
      return { source: await readFile(template, "utf8") };
    },
  };
}

export default razor;

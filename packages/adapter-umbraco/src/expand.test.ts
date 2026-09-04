import { afterEach, describe, expect, test, vi } from "vitest";
import umbraco from "./index";
import type { Story } from "@bgunnarsson/binbook-types";

const endpoint = "https://localhost:44300/binbook/render";

function manifest(over: Partial<Story> = {}): Story {
  return {
    id: "blocks",
    title: "Blocks",
    component: "",
    args: {},
    variants: [{ name: "Default", args: {} }],
    file: "/abs/blocks.binbook.json",
    umbraco: { mode: "live", blockList: { content: { route: "/showcase" }, property: "blocks" } },
    ...over,
  };
}

/** Stub `fetch`, capturing the last POST body and returning `payload` as JSON. */
function stubFetch(payload: unknown) {
  // The captured bodies are checked field by field below, so a record is the
  // shape the assertions want — not `any`, which would let a typo through.
  const calls: Record<string, unknown>[] = [];
  const fn = vi.fn(async (_url: string, init: { body: string }) => {
    calls.push(JSON.parse(init.body));
    return { ok: true, status: 200, text: async () => JSON.stringify(payload) } as Response;
  });
  vi.stubGlobal("fetch", fn);
  return calls;
}

afterEach(() => vi.unstubAllGlobals());

describe("expand (Block List manifest)", () => {
  test("non-manifest stories pass through untouched", async () => {
    const plain: Story = { ...manifest(), umbraco: { mode: "live", content: { route: "/home" } } };
    const out = await umbraco({ umbracoEndpoint: endpoint }).expand!(plain);
    expect(out).toEqual([plain]);
  });

  test("expands one story per block type plus a full-page story", async () => {
    const calls = stubFetch({
      blocks: [
        { alias: "heroBlock", name: "Hero" },
        { alias: "ctaBlock", name: "Cta" },
      ],
    });
    const out = await umbraco({ umbracoEndpoint: endpoint }).expand!(manifest());

    // Enumerated the node's block-list property.
    expect(calls[0]).toEqual({ list: true, content: { route: "/showcase" }, property: "blocks" });

    expect(out.map((s) => s.title)).toEqual(["Blocks/Hero", "Blocks/Cta", "Blocks/Full page"]);
    expect(out.map((s) => s.id)).toEqual(["blocks-hero", "blocks-cta", "blocks-full-page"]);

    // Per-block stories address the block by content-type alias, and the view
    // path is resolved from the default Umbraco convention.
    expect(out[0].component).toBe("~/Views/Partials/blocklist/Components/heroBlock.cshtml");
    expect(out[0].umbraco?.block).toEqual({
      property: "blocks",
      type: "heroBlock",
      viewPath: "~/Views/Partials/blocklist/Components/{alias}.cshtml",
    });
    // All expanded stories keep the manifest file so watch + adapter-matching hold.
    expect(out[0].file).toBe("/abs/blocks.binbook.json");

    // The full-page story renders the whole list (no `type`) but still carries
    // the template so the endpoint can resolve each item's view.
    expect(out[2].umbraco?.block).toEqual({
      property: "blocks",
      viewPath: "~/Views/Partials/blocklist/Components/{alias}.cshtml",
    });
  });

  test("honors a project-specific viewPath template ({alias} + {Alias})", async () => {
    stubFetch({ blocks: [{ alias: "heroBlock", name: "Hero" }] });
    const withPath = manifest({
      umbraco: {
        mode: "live",
        blockList: {
          content: { route: "/showcase" },
          property: "blocks",
          viewPath: "~/Views/Partials/MyProject/Blocks/{Alias}.cshtml",
        },
      },
    });
    const out = await umbraco({ umbracoEndpoint: endpoint }).expand!(withPath);
    // {Alias} → PascalCase file name under the project's own folder.
    expect(out[0].component).toBe("~/Views/Partials/MyProject/Blocks/HeroBlock.cshtml");
    expect(out[0].umbraco?.block?.viewPath).toBe("~/Views/Partials/MyProject/Blocks/{Alias}.cshtml");
  });

  test("empty block list yields just the full-page story", async () => {
    stubFetch({ blocks: [] });
    const out = await umbraco({ umbracoEndpoint: endpoint }).expand!(manifest());
    expect(out.map((s) => s.title)).toEqual(["Blocks/Full page"]);
  });
});

describe("render (block selector)", () => {
  const blockStory: Story = {
    id: "blocks-hero",
    title: "Blocks/Hero",
    component: "~/Views/Partials/blocklist/Components/heroBlock.cshtml",
    args: {},
    variants: [{ name: "Default", args: {} }],
    file: "/abs/blocks.binbook.json",
    umbraco: { mode: "live", content: { route: "/showcase" }, block: { property: "blocks", type: "heroBlock" } },
  };

  test("forwards the block selector to the endpoint", async () => {
    const calls = stubFetch({ html: "<section>hero</section>" });
    const result = await umbraco({ umbracoEndpoint: endpoint }).render({
      story: blockStory,
      component: blockStory.component,
      args: {},
      root: "/abs",
    });
    expect(calls[0].block).toEqual({ property: "blocks", type: "heroBlock" });
    expect(calls[0].content).toEqual({ route: "/showcase" });
    expect(result.html).toContain("hero");
    // The live site's origin drives asset resolution inside the canvas.
    expect(result.baseHref).toBe("https://localhost:44300");
  });
});

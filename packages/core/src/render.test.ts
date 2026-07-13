import { expect, test } from "vitest";
import { AdapterRegistry } from "./registry";
import { renderStory } from "./render";
import type { Adapter, Story } from "@bgunnarsson/binbook-types";

const fakeAdapter: Adapter = {
  name: "fake",
  storyGlob: "**/*.binbook.json",
  async render(ctx) {
    return { html: `variant=${ctx.args.variant};label=${ctx.args.label}` };
  },
};

let captured: string[] | undefined;
const captureAdapter: Adapter = {
  name: "capture",
  storyGlob: "**/*.binbook.json",
  async render(ctx) {
    captured = ctx.decorators;
    return { html: "" };
  },
};

const story: Story = {
  id: "components-button",
  title: "Components/Button",
  component: "x",
  args: {
    label: { type: "text", default: "Click me" },
    variant: { type: "select", options: ["primary", "ghost"], default: "primary" },
  },
  variants: [
    { name: "Default", args: {} },
    { name: "Ghost", args: { variant: "ghost" } },
  ],
  file: "/x.binbook.json",
};

test("renderStory resolves args for the variant and passes them to the adapter", async () => {
  const registry = new AdapterRegistry([fakeAdapter]);
  const result = await renderStory(registry, story, "Ghost", {}, "/root");
  expect(result.html).toBe("variant=ghost;label=Click me");
});

test("live args win over the variant", async () => {
  const registry = new AdapterRegistry([fakeAdapter]);
  const result = await renderStory(registry, story, "Ghost", { variant: "primary" }, "/root");
  expect(result.html).toBe("variant=primary;label=Click me");
});

test("unknown variant throws", async () => {
  const registry = new AdapterRegistry([fakeAdapter]);
  await expect(renderStory(registry, story, "Nope", {}, "/root")).rejects.toThrow(/variant/i);
});

test("resolves global + story decorators to absolute refs, global outermost", async () => {
  const registry = new AdapterRegistry([captureAdapter]);
  const decorated: Story = { ...story, file: "/proj/src/nav/nav.binbook.json", decorators: ["../deco/withRouter.tsx#default"] };
  await renderStory(registry, decorated, "Default", {}, "/proj", ["./global/withTheme.tsx"]);
  expect(captured).toEqual([
    "/proj/global/withTheme.tsx", // global: resolved from root, outermost
    "/proj/src/deco/withRouter.tsx#default", // story: resolved from story dir, keeps #export
  ]);
});

test("no decorators yields an empty list", async () => {
  const registry = new AdapterRegistry([captureAdapter]);
  await renderStory(registry, story, "Default", {}, "/root");
  expect(captured).toEqual([]);
});

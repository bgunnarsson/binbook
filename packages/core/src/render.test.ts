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

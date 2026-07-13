import { fileURLToPath } from "node:url";
import path from "node:path";
import { expect, test } from "vitest";
import svelte from "./index";
import type { RenderContext, Story } from "@bgunnarsson/binbook-types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "../test/fixtures");

const story: Story = {
  id: "components-button",
  title: "Components/Button",
  component: "./Button.svelte",
  args: {},
  variants: [],
  file: path.join(root, "Button.binbook.json"),
};

const ctx = (args: Record<string, unknown>): RenderContext => ({
  story,
  component: "./Button.svelte",
  args,
  root,
});

test("adapter metadata", () => {
  expect(svelte().name).toBe("svelte");
  expect(svelte().storyGlob).toBe("**/*.binbook.json");
});

test("static mode (hydrate:false) server-renders markup and ships no client script", async () => {
  const result = await svelte({ hydrate: false }).render(ctx({ variant: "ghost", label: "Buy" }));
  expect(result.html).toContain('class="btn btn--ghost"');
  expect(result.html).toContain("Buy");
  expect(result.clientScript).toBeUndefined();
});

test("hydration wraps markup in the mount root and exposes props to the client", async () => {
  const result = await svelte().render(ctx({ variant: "ghost", label: "Buy" }));
  expect(result.html).toContain('<div id="binbook-root">');
  expect(result.html).toContain('class="btn btn--ghost"');
  expect(result.html).toContain('window.__BINBOOK_ARGS__={"variant":"ghost","label":"Buy"}');
  // Self-contained client bundle that hydrates, no stray close tag.
  expect(result.clientScript).toContain("hydrate");
  expect(result.clientScript).not.toContain("</script>");
});

test("props change the rendered output", async () => {
  const ghost = await svelte().render(ctx({ variant: "ghost", label: "A" }));
  const primary = await svelte().render(ctx({ variant: "primary", label: "B" }));
  expect(ghost.html).toContain("btn--ghost");
  expect(primary.html).toContain("btn--primary");
  expect(ghost.html).not.toBe(primary.html);
});

test("args JSON is escaped so it can't break out of the inline script", async () => {
  const result = await svelte().render(ctx({ label: "</script><b>x", variant: "primary" }));
  expect(result.html).not.toContain("</script><b>x");
  expect(result.html).toContain("\\u003c/script>");
});

test("docs returns the component source", async () => {
  const meta = await svelte().docs!(story);
  expect(meta.source).toContain("btn btn--{variant}");
});

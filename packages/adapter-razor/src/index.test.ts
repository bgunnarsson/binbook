import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, test, expect, beforeAll, afterAll } from "vitest";
import razor from "./index";
import { dotnetAvailable, buildHost, sharedHost } from "./host-client";
import type { RenderContext, Story } from "@bgunnarsson/binbook-types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "../test/fixtures");
const story: Story = {
  id: "components-button",
  title: "Components/Button",
  component: "./Button.cshtml",
  args: {},
  variants: [],
  file: path.join(root, "Button.binbook.json"),
};

const ctx = (args: Record<string, unknown>): RenderContext => ({
  story,
  component: "./Button.cshtml",
  args,
  root,
});

test("adapter metadata", () => {
  expect(razor().name).toBe("razor");
  expect(razor().storyGlob).toBe("**/*.binbook.json");
});

test("docs returns the template source", async () => {
  const meta = await razor().docs!(story);
  expect(meta.source).toContain("@Model.label");
});

// Rendering needs the .NET SDK; skip cleanly where it is unavailable.
describe.skipIf(!dotnetAvailable())("rendering via the .NET host", () => {
  beforeAll(async () => {
    await buildHost();
  }, 300_000);
  afterAll(() => sharedHost().dispose());

  test("passes args to the Razor model", async () => {
    const { html } = await razor().render(ctx({ variant: "ghost", label: "Buy", disabled: true }));
    expect(html).toContain('class="btn btn--ghost"');
    expect(html).toContain("Buy");
    expect(html).toContain("disabled");
  }, 60_000);

  test("a false bool omits its conditional attribute", async () => {
    const { html } = await razor().render(ctx({ variant: "primary", label: "Go", disabled: false }));
    expect(html).not.toContain("disabled");
  }, 60_000);

  test("a missing arg renders empty instead of throwing", async () => {
    const { html } = await razor().render(ctx({ variant: "ghost" }));
    expect(html).toContain("btn--ghost");
  }, 60_000);
});

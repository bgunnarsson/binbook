import { fileURLToPath } from "node:url";
import path from "node:path";
import { expect, test } from "vitest";
import templates, { handlebars, nunjucks, ejs } from "./index";
import type { RenderContext, Story } from "@bgunnarsson/binbook-types";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "../test/fixtures");

const story: Story = {
  id: "components-button",
  title: "Components/Button",
  component: "./button.hbs",
  args: {},
  variants: [],
  file: path.join(root, "button.binbook.json"),
};

const ctx = (args: Record<string, unknown>, component = "./button.hbs"): RenderContext => ({
  story,
  component,
  args,
  root,
});

test("adapter metadata", () => {
  const a = templates({ engine: handlebars() });
  expect(a.name).toBe("templates");
  expect(a.storyGlob).toBe("**/*.binbook.json");
});

test("renders a component through the configured engine", async () => {
  const result = await templates({ engine: handlebars() }).render(ctx({ variant: "ghost", label: "Buy" }));
  expect(result.html.trim()).toBe('<button class="btn btn--ghost">Buy</button>');
});

test("a single engine renders any extension", async () => {
  // handlebars registered alone still renders the .njk file (no disambiguation needed)
  const njk = await templates({ engine: nunjucks() }).render(ctx({ variant: "ghost", label: "Buy" }, "./button.njk"));
  expect(njk.html.trim()).toBe('<button class="btn btn--ghost">Buy</button>');
});

test("with several engines the file extension selects one", async () => {
  const adapter = templates({ engine: [handlebars(), nunjucks(), ejs()] });
  const a = { variant: "primary", disabled: false };
  const hbs = await adapter.render(ctx({ ...a, label: "H" }, "./button.hbs"));
  const njk = await adapter.render(ctx({ ...a, label: "N" }, "./button.njk"));
  const e = await adapter.render(ctx({ ...a, label: "E" }, "./button.ejs"));
  expect(hbs.html).toContain(">H<");
  expect(njk.html).toContain(">N<");
  expect(e.html).toContain(">E<");
});

test("throws for an unknown extension when engines can't disambiguate", async () => {
  const adapter = templates({ engine: [handlebars(), ejs()] });
  await expect(adapter.render(ctx({}, "./button.njk"))).rejects.toThrow(/no engine for "\.njk"/);
});

test("requires at least one engine", () => {
  expect(() => templates({ engine: [] })).toThrow(/at least one engine/);
});

test("docs returns the template source", async () => {
  const meta = await templates({ engine: handlebars() }).docs!(story);
  expect(meta.source).toContain("btn--{{variant}}");
});

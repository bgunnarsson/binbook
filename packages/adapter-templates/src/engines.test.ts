import { fileURLToPath } from "node:url";
import path from "node:path";
import { describe, expect, test } from "vitest";
import { handlebars, nunjucks, ejs } from "./engines";
import type { TemplateEngine } from "./index";

const dir = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(dir, "../test/fixtures");
const ctx = { file: path.join(root, "x"), root };

// Each engine renders the same logical button from its own syntax.
const cases: { engine: TemplateEngine; source: string }[] = [
  { engine: handlebars(), source: '<b class="{{variant}}"{{#if disabled}} disabled{{/if}}>{{label}}</b>' },
  { engine: nunjucks(), source: '<b class="{{ variant }}"{% if disabled %} disabled{% endif %}>{{ label }}</b>' },
  { engine: ejs(), source: '<b class="<%= variant %>"<% if (disabled) { %> disabled<% } %>><%= label %></b>' },
];

describe.each(cases)("engine: $engine.name", ({ engine, source }) => {
  test("declares extensions with a leading dot", () => {
    expect(engine.extensions.length).toBeGreaterThan(0);
    for (const e of engine.extensions) { expect(e.startsWith(".")).toBe(true); }
  });

  // Core always feeds resolved args (declared keys + defaults), so every
  // referenced var is present — mirror that here (EJS throws on bare undefined
  // identifiers, unlike Handlebars/Nunjucks).
  test("interpolates args", async () => {
    const out = await engine.render(source, { variant: "ghost", label: "Buy", disabled: false }, ctx);
    expect(out).toBe('<b class="ghost">Buy</b>');
  });

  test("evaluates conditionals", async () => {
    const out = await engine.render(source, { variant: "p", label: "X", disabled: true }, ctx);
    expect(out).toContain(" disabled");
  });

  test("HTML-escapes interpolated values by default", async () => {
    const out = await engine.render(source, { variant: "p", label: "<script>", disabled: false }, ctx);
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
  });
});

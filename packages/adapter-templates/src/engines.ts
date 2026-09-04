import type { TemplateEngine } from "./index";

/**
 * Engine libraries are optional peer dependencies — a project installs only the
 * one(s) it uses. Loading through a variable specifier keeps them out of the
 * adapter's own type graph (no `@types/*` needed) and defers the import until a
 * story of that kind is actually rendered.
 */
// Each engine is an optional peer, imported by name at run time. There is no
// shared shape to type this as, and callers destructure what they know.
// biome-ignore lint/suspicious/noExplicitAny: an optional peer resolved by name
async function load(name: string): Promise<any> {
  try {
    return await import(name);
  } catch {
    throw new Error(
      `templates adapter: the "${name}" package is required for this engine. Install it in your project (e.g. \`pnpm add -D ${name}\`).`,
    );
  }
}

/** Handlebars — `{{expr}}` auto-escapes, `{{{expr}}}` is raw. */
export function handlebars(): TemplateEngine {
  return {
    name: "handlebars",
    extensions: [".hbs", ".handlebars"],
    async render(source, args) {
      const mod = await load("handlebars");
      const Handlebars = mod.default ?? mod;
      return Handlebars.compile(source)(args);
    },
  };
}

/** Nunjucks — Jinja-style `{{ expr }}` / `{% tag %}`, autoescape on. */
export function nunjucks(): TemplateEngine {
  return {
    name: "nunjucks",
    extensions: [".njk", ".nunjucks"],
    async render(source, args) {
      const mod = await load("nunjucks");
      const nunjucksLib = mod.default ?? mod;
      const env = new nunjucksLib.Environment(null, { autoescape: true });
      return env.renderString(source, args);
    },
  };
}

/** EJS — `<%= expr %>` escapes, `<%- expr %>` is raw. */
export function ejs(): TemplateEngine {
  return {
    name: "ejs",
    extensions: [".ejs"],
    async render(source, args, ctx) {
      const mod = await load("ejs");
      const ejsLib = mod.default ?? mod;
      // `filename` lets templates use <%- include(...) %> relative to themselves.
      return ejsLib.render(source, args, { filename: ctx.file });
    },
  };
}

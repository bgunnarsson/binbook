# @bgunnarsson/binbook-adapter-razor

Renders .NET Razor components in [binbook](https://github.com/bgunnarsson/binbook).

It supports two render modes, chosen **per story** via the `razor` block in a
`.binbook.json` file:

| Mode | Renders | Where it runs | Needs |
| --- | --- | --- | --- |
| `mvc` (default) | Tag Helpers, layouts, plain Razor components | An embedded ASP.NET Core Razor engine bundled with the adapter | the .NET SDK |
| `umbraco` | Full Umbraco partials — `@inherits UmbracoViewPage`, block lists, `Umbraco.*`, DI, real content | Your live Umbraco site, via a dev render endpoint | the site running + an endpoint |

Both modes render through the real ASP.NET Core MVC Razor view engine, so Tag
Helpers work everywhere. Umbraco content context (`IPublishedContent`) only
exists in `umbraco` mode, because only a booted Umbraco process has it.

## Config

```ts
import razor from "@bgunnarsson/binbook-adapter-razor";

export default defineConfig({
  adapters: [
    razor({
      // Required for any `mode: "umbraco"` story — your site's render endpoint.
      umbracoEndpoint: "https://localhost:44300/binbook/render",
      // Absolute paths to assemblies exposing Tag Helpers used by `mvc` templates
      // (e.g. the vv-* TagHelper library), so `@addTagHelper` resolves offline.
      tagHelperAssemblies: [
        "/abs/path/to/Vettvangur.Web.dll",
      ],
    }),
  ],
});
```

## `mvc` mode (default)

`component` is a `.cshtml` path relative to the story file. Args become a dynamic
`@Model`; a referenced-but-missing arg renders empty instead of throwing.

```jsonc
{
  "title": "Components/Button",
  "component": "./Button.cshtml",
  "args": { "variant": { "type": "text", "default": "primary" } },
  "stories": [{ "name": "Default", "args": {} }]
}
```

Tag Helpers work out of the box (add `@addTagHelper` in the template or a
co-located `_ViewImports.cshtml`; register custom tag-helper assemblies via
`tagHelperAssemblies`). Composing other partials by bare relative name is **not**
resolved in this mode — that is `umbraco` mode's job, where the site's own view
locations apply.

## `umbraco` mode

`component` is the site-relative view path. `razor.content` references a real
published node (tried in order: `key` → `id` → `route`) so the partial renders
against a genuine `IPublishedContent` model. `args` are layered over the model as
`ViewData`.

```jsonc
{
  "title": "Features/Hero",
  "component": "~/Views/Partials/Blocks/Hero.cshtml",
  "razor": { "mode": "umbraco", "content": { "route": "/en/home" } },
  "args": {},
  "stories": [{ "name": "Home", "args": {} }]
}
```

### The render endpoint

The adapter POSTs to `umbracoEndpoint`:

```
POST /binbook/render
  { "view": "~/Views/Partials/Blocks/Hero.cshtml",
    "content": { "route": "/en/home" },
    "args": { ... } }
→ 200 { "html": "..." }        // or { "error": "..." } / non-2xx
```

A `{ "view": "...", "source": true }` request should return
`{ "source": "<raw .cshtml>" }` for the docs panel (optional).

Drop the reference controller in [`samples/BinbookRenderController.cs`](./samples/BinbookRenderController.cs)
into your Umbraco site and adapt it to your version and model shape. **It is
dev-only** — it renders arbitrary server views and must never be reachable in
production (the sample guards on `IWebHostEnvironment.IsDevelopment()`).

## Roadmap

`umbraco` mode talks to a *running* site today. A later step will let binbook
boot Umbraco itself (referencing the consumer's Site assembly) and reuse the same
`POST /binbook/render` contract against an in-process instance — no separate site
process required.

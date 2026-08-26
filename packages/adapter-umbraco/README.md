# @bgunnarsson/binbook-adapter-umbraco

Renders Umbraco partials and Block List blocks — plus plain .NET Razor components
— in [binbook](https://github.com/bgunnarsson/binbook).

It supports two render modes, chosen **per story** via the `umbraco` block in a
`.binbook.json` file:

| Mode | Renders | Where it runs | Needs |
| --- | --- | --- | --- |
| `offline` (default) | Tag Helpers, layouts, plain Razor components | An embedded ASP.NET Core Razor engine bundled with the adapter | the .NET SDK |
| `live` | Full Umbraco partials — `@inherits UmbracoViewPage`, block lists, `Umbraco.*`, DI, real content | Your live Umbraco site, via a dev render endpoint | the site running + an endpoint |

Both modes render through the real ASP.NET Core MVC Razor view engine, so Tag
Helpers work everywhere. Umbraco content context (`IPublishedContent`) only
exists in `live` mode, because only a booted Umbraco process has it.

## Config

```ts
import umbraco from "@bgunnarsson/binbook-adapter-umbraco";

export default defineConfig({
  adapters: [
    umbraco({
      // Required for any `mode: "live"` story — your site's render endpoint.
      umbracoEndpoint: "https://localhost:44300/binbook/render",
      // Optional auth headers for the render endpoint. A dev-only endpoint that
      // gates on a shared secret (recommended — Umbraco 14+ backoffice uses bearer
      // tokens, so there's no cookie to copy) reads it from a header:
      headers: { "X-Binbook-Secret": process.env.BINBOOK_UMBRACO_SECRET ?? "" },
      // Absolute paths to assemblies exposing Tag Helpers used by `offline` templates
      // (e.g. the vv-* TagHelper library), so `@addTagHelper` resolves offline.
      tagHelperAssemblies: [
        "/abs/path/to/Vettvangur.Web.dll",
      ],
    }),
  ],
});
```

## `offline` mode (default)

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
resolved in this mode — that is `live` mode's job, where the site's own view
locations apply.

## `live` mode

`component` is the site-relative view path. `umbraco.content` references a real
published node (tried in order: `key` → `id` → `route`) so the partial renders
against a genuine `IPublishedContent` model. `args` are layered over the model as
`ViewData`.

```jsonc
{
  "title": "Features/Hero",
  "component": "~/Views/Partials/Blocks/Hero.cshtml",
  "umbraco": { "mode": "live", "content": { "route": "/en/home" } },
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

## Block Lists

A Block List block view is typed as `BlockListItem` (`Model.Content`,
`Model.Settings`), not `IPublishedContent`, so it can't render against a node the
way a normal partial does — it needs a real, authored block. The idiomatic fix is
a **showcase node**: one content node whose block list holds one of every block
type. Point a single *manifest* story at it and binbook expands it — at discovery
— into one story per block type **plus** a full-page story that renders the whole
list:

```jsonc
// blocks.binbook.json — no `component`/`stories`; the blocks supply them.
{
  "title": "Blocks",
  "umbraco": {
    "mode": "live",
    "blockList": {
      "content": { "route": "/binbook-showcase" },
      "property": "blocks",
      // Optional. Defaults to Umbraco's convention below; set it to your
      // project's folder. `{alias}` is the element alias verbatim (heroBlock),
      // `{Alias}` is PascalCase (HeroBlock).
      "viewPath": "~/Views/Partials/blocklist/Components/{alias}.cshtml"
    }
  }
}
```

Blocks are addressed by **content-type alias**, so reordering the showcase list
doesn't break the stories. Add a block type to the showcase in the backoffice and
its story appears on the next reload — nothing to hand-author. The expansion is a
live query, so an unreachable site drops just the manifest (with a warning), never
the rest of the catalog.

The **block-view folder varies per project**, so the path is a template on the
story, not baked into the endpoint. It's resolved per block from the alias and
sent to the endpoint, which never has to guess a folder.

The manifest drives two more endpoint shapes on top of the render call above:

```
POST /binbook/render
  { "list": true, "content": { "route": "/binbook-showcase" }, "property": "blocks" }
→ 200 { "blocks": [ { "alias": "heroBlock", "name": "Hero" }, … ] }

POST /binbook/render     // one block by alias, or the whole list when `type` is omitted
  { "content": { "route": "/binbook-showcase" },
    "block": { "property": "blocks", "type": "heroBlock",
               "viewPath": "~/Views/Partials/MyProject/Blocks/{alias}.cshtml" } }
→ 200 { "html": "..." }
```

The reference controller resolves `viewPath` per block (falling back to the
Umbraco convention when a story omits it), so you configure the folder in the
story — no controller edits needed.

**Note:** the Controls panel is inert for block stories — block content is
authored in the showcase node, not passed as args. These stories render the real
production block with its real data; they aren't a prop playground.

## Roadmap

`live` mode talks to a *running* site today. A later step will let binbook
boot Umbraco itself (referencing the consumer's Site assembly) and reuse the same
`POST /binbook/render` contract against an in-process instance — no separate site
process required.

# Umbraco adapter

Renders Razor views. In **offline** mode it renders plain `.cshtml` components with the real
ASP.NET Core Razor engine, Tag Helpers included, and needs no site. In **live** mode it asks your
running Umbraco site to render a partial or a Block List block against real published content.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-umbraco
```

| Mode | Renders | Runs in | Needs |
| --- | --- | --- | --- |
| `offline` (default) | `.cshtml` components, Tag Helpers, layouts | A .NET 8 Razor host bundled with the adapter | The .NET 8 SDK |
| `live` | Full Umbraco partials: `UmbracoViewPage`, `Umbraco.*` helpers, DI, Block Lists, real content | Your Umbraco site | The site running, with a render endpoint added |

Both modes use the ASP.NET Core MVC view engine, so Tag Helpers behave the same in each. Umbraco
content (`IPublishedContent`) exists only in live mode, because only a booted Umbraco process has
it.

The mode is chosen per story, so one project can mix offline components and live partials.

## Config

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import umbraco from "@bgunnarsson/binbook-adapter-umbraco";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [
    umbraco({
      umbracoEndpoint: process.env.BINBOOK_UMBRACO_ENDPOINT,
      headers: { "X-Binbook-Secret": process.env.BINBOOK_UMBRACO_SECRET ?? "" },
      tagHelperAssemblies: ["/abs/path/to/MySite.Web/bin/Debug/net8.0/MySite.Web.dll"],
    }),
  ],
  styles: ["./wwwroot/dist/main.css"],
  scripts: ["./wwwroot/dist/main.js"],
});
```

| Option | Mode | |
| --- | --- | --- |
| `umbracoEndpoint` | live | URL of the render endpoint on your site, e.g. `https://localhost:44300/binbook/render`. Required for any live story |
| `headers` | live | Headers sent with every request to the endpoint, typically a shared secret |
| `tagHelperAssemblies` | offline | Absolute paths to compiled assemblies whose Tag Helpers your templates use |

## Offline mode

### Requirements

The .NET 8 SDK on your `PATH` (`dotnet --version` should print 8.x or later). The first offline
render builds the bundled Razor host with `dotnet build`, which restores NuGet packages and takes a
little while; after that the host stays running for the life of the dev server and renders are
fast.

### Components

`component` is a `.cshtml` file relative to the story file. Args are available as a dynamic
`@Model`; an arg the template references but the story does not set renders empty rather than
throwing.

```cshtml
@* src/button/Button.cshtml *@
<button class="btn btn--@Model.variant btn--@Model.size" disabled="@Model.disabled">@Model.label</button>
```

```json
{
  "title": "Components/Button",
  "component": "./Button.cshtml",
  "args": {
    "label": { "type": "text", "default": "Click me" },
    "variant": { "type": "select", "options": ["primary", "secondary", "ghost"], "default": "primary" },
    "size": { "type": "select", "options": ["sm", "md", "lg"], "default": "md" },
    "disabled": { "type": "boolean", "default": false }
  },
  "stories": [{ "name": "Primary", "args": {} }, { "name": "Disabled", "args": { "disabled": true } }]
}
```

Razor's own attribute rules apply: `disabled="@Model.disabled"` drops the attribute when the value
is `false` and renders `disabled="disabled"` when it is `true`.

The story's `umbraco` block can be left out, since offline is the default.

### Tag Helpers

Add `@addTagHelper` in the template or in a `_ViewImports.cshtml` beside it. The built-in ASP.NET
Core Tag Helpers work out of the box. For your own, list the compiled assemblies that contain them
in `tagHelperAssemblies`; build your project first so the DLLs exist. They are loaded when the host
starts, so restart `binbook dev` after rebuilding them.

### Limits

- No Umbraco context: `UmbracoViewPage`, `Umbraco.*` helpers and published content are not
  available. Use live mode for those.
- Partials referenced by bare name (`<partial name="Card" />`) do not resolve; the site's view
  locations exist only in live mode.
- No services from your site's DI container.

## Live mode

Live mode sends each render to an endpoint inside your running Umbraco site, so the partial
renders in the real process, with real content, services and Tag Helpers.

### 1. Add the endpoint to your site

Copy
[`packages/adapter-umbraco/samples/BinbookRenderController.cs`](../../packages/adapter-umbraco/samples/BinbookRenderController.cs)
into your Umbraco site and adjust the namespace, the content lookup and the model shape for your
Umbraco version and views. It targets Umbraco 13+ on .NET 8.

The controller is for development only. It renders any view it is asked for and returns view
source, so it must never be reachable in production. The sample returns 404 outside the
`Development` environment, and inside it requires a shared secret.

### 2. Set the shared secret

In the site's development config, for example `appsettings.Development.json` or user secrets:

```json
{ "Binbook": { "Secret": "a-long-random-string" } }
```

And give binbook the same value:

```bash
export BINBOOK_UMBRACO_ENDPOINT=https://localhost:44300/binbook/render
export BINBOOK_UMBRACO_SECRET=a-long-random-string
```

```ts
umbraco({
  umbracoEndpoint: process.env.BINBOOK_UMBRACO_ENDPOINT,
  headers: { "X-Binbook-Secret": process.env.BINBOOK_UMBRACO_SECRET ?? "" },
}),
```

The sample controller rejects every request when `Binbook:Secret` is unset. When the endpoint
answers 401 or 403, the render fails with an error saying the request needs an auth header. See
[Troubleshooting](../troubleshooting.md#the-canvas-says-render-error) for where to read it.

### 3. Write a live story

`component` is the view's path in the site. `umbraco.content` picks the published node to render
against, by `key` (GUID), `id` or `route`; the endpoint tries them in that order. Args are added
to the view's `ViewData`.

```json
{
  "title": "Features/Hero",
  "description": "The home page hero, rendered against real content.",
  "component": "~/Views/Partials/Blocks/Hero.cshtml",
  "umbraco": { "mode": "live", "content": { "route": "/en/home" } },
  "args": {},
  "stories": [{ "name": "Home", "args": {} }]
}
```

### Self-signed certificates

A local Umbraco site usually serves HTTPS with a development certificate Node does not trust.
Either trust the certificate (`dotnet dev-certs https --trust`, then point Node at it with
`NODE_EXTRA_CA_CERTS`), point `umbracoEndpoint` at the site's HTTP port if it has one, or, as a
last resort on your own machine, start binbook with `NODE_TLS_REJECT_UNAUTHORIZED=0`.

### Assets and icons

Live markup refers to the site's assets by root-relative path: `/media/…`, `/dist/…`. The adapter
sets the canvas's base URL to the endpoint's origin so those load from the site.

SVG sprites used through `<use href="/icons.svg#arrow">` cannot load across origins, so the adapter
fetches each referenced sprite on the server and inlines the symbols into the markup. Sprites are
cached for the life of the dev server; restart it after changing them.

### Front-end JavaScript

Live partials often rely on the site's JavaScript for carousels, accordions and the like. List the
site's built bundle in [`scripts`](../configuration.md#scripts) so it runs in the canvas.

## Block Lists

A Block List block view is typed as a `BlockListItem` (`Model.Content`, `Model.Settings`), not as a
page, so it cannot render against a node the way a partial does: it needs a real, authored block.

The approach is a **showcase node**: one content node, usually hidden from navigation, whose block
list holds one of every block type. A single manifest story points at it, and binbook expands it,
when it discovers stories, into one story per block type plus a **Full page** story that renders
the whole list in order.

```json
{
  "title": "Blocks",
  "umbraco": {
    "mode": "live",
    "blockList": {
      "content": { "route": "/binbook-showcase" },
      "property": "blocks",
      "viewPath": "~/Views/Partials/blocklist/Components/{alias}.cshtml"
    }
  }
}
```

A manifest has no `component` or `stories` of its own; the blocks supply them.

| Field | |
| --- | --- |
| `content` | The showcase node: `key`, `id` or `route` |
| `property` | Alias of the Block List property on that node |
| `viewPath` | Where block views live. `{alias}` is the element type alias as-is (`heroBlock`), `{Alias}` capitalises its first letter (`HeroBlock`). Defaults to `~/Views/Partials/blocklist/Components/{alias}.cshtml` |

Blocks are matched by element type alias, so reordering the showcase list does not change the
stories. Add a block type to the showcase in the backoffice and its story appears after the next
re-scan and a browser refresh.

If the site cannot be reached when binbook starts, the manifest is skipped with a warning in the
terminal and every other story still loads.

The Controls tab has nothing to change for block stories: their content is authored in the
showcase node, not passed as args. They render the production block with its real data.

## The render endpoint contract

If you write your own endpoint instead of adapting the sample, this is what the adapter sends.
Every request is a JSON `POST` to `umbracoEndpoint`, with your `headers`.

Render a view against a node:

```
{ "view": "~/Views/Partials/Blocks/Hero.cshtml", "content": { "route": "/en/home" }, "args": { … } }
→ 200 { "html": "…" }
```

Render one block, or the whole list when `type` is left out:

```
{ "view": "…", "content": { "route": "/binbook-showcase" }, "args": {},
  "block": { "property": "blocks", "type": "heroBlock", "viewPath": "~/Views/…/{alias}.cshtml" } }
→ 200 { "html": "…" }
```

List the blocks on a node, for manifest expansion:

```
{ "list": true, "content": { "route": "/binbook-showcase" }, "property": "blocks" }
→ 200 { "blocks": [ { "alias": "heroBlock", "name": "Hero" }, … ] }
```

Return a view's source, for the Code tab and Docs view (optional):

```
{ "view": "~/Views/Partials/Blocks/Hero.cshtml", "source": true }
→ 200 { "source": "…" }
```

On failure, return a non-2xx status, or `{ "error": "…" }`. The message becomes the render error.

## Docs and watching

Offline stories show the `.cshtml` file in the Code tab and Docs view, and re-render when it or the
story file is saved. Live stories show whatever the endpoint returns for a source request, and
re-render only when the story file is saved, since the view lives in the site; reload the browser
to pick up a view you changed there.

## Example

`examples/umbraco-sandbox` has offline Razor components and two live examples, `hero.binbook.json.example`
and `blocks/blocks.binbook.json.example`. Remove `.example` from a name to enable it once your site
is running.

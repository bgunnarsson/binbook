# Getting started

This page takes a project from nothing to a running binbook with one component. It uses the HTML
adapter because it needs no framework; the steps are the same for the others, with a different
adapter package and component file.

## Requirements

- Node.js 20 or newer.
- A package manager: pnpm, npm or yarn all work.
- For the Umbraco adapter only: the .NET 8 SDK. See [Umbraco](adapters/umbraco.md).

## 1. Install

Install the core package and one adapter as dev dependencies:

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-html
```

`@bgunnarsson/binbook-core` brings the `binbook` CLI and the viewer with it. Pick the adapter for
the components you have:

| Components | Package | Also install |
| --- | --- | --- |
| Plain HTML | `@bgunnarsson/binbook-adapter-html` | — |
| React | `@bgunnarsson/binbook-adapter-react` | `react`, `react-dom` (18+) |
| Vue 3 | `@bgunnarsson/binbook-adapter-vue` | `vue` (3.3+) |
| Svelte 5 | `@bgunnarsson/binbook-adapter-svelte` | `svelte` (5+) |
| Custom elements / Lit | `@bgunnarsson/binbook-adapter-web-components` | `lit` (3+), only if you use it |
| Handlebars / Nunjucks / EJS | `@bgunnarsson/binbook-adapter-templates` | the engine you use |
| Razor / Umbraco | `@bgunnarsson/binbook-adapter-umbraco` | the .NET 8 SDK |

Framework packages are peer dependencies: binbook uses the copy your project already has.

## 2. Create `binbook.config.ts`

binbook looks for `binbook.config.ts` in the directory you run it from.

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import html from "@bgunnarsson/binbook-adapter-html";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [html()],
});
```

`stories` is a list of globs, relative to the config file, that find your story files. Every
other option is described in [Configuration](configuration.md).

## 3. Write a component

`src/button/button.html`:

```html
<button class="btn btn--{{variant}}" {{disabled}}>{{label}}</button>
```

## 4. Write its story

A story file sits next to the component and describes it: its name in the sidebar, which file
to render, which args it takes, and a few named variants.

`src/button/button.binbook.json`:

```json
{
  "title": "Components/Button",
  "description": "Primary call-to-action button.",
  "component": "./button.html",
  "args": {
    "label": { "type": "text", "default": "Click me" },
    "variant": { "type": "select", "options": ["primary", "secondary", "ghost"], "default": "primary" },
    "disabled": { "type": "boolean", "default": false }
  },
  "stories": [
    { "name": "Default", "args": {} },
    { "name": "Ghost", "args": { "variant": "ghost" } },
    { "name": "Disabled", "args": { "disabled": true } }
  ]
}
```

The full format is in [Writing stories](stories.md).

## 5. Run it

```bash
pnpm exec binbook dev
```

(`npx binbook dev` with npm.) Open <http://localhost:6006>. The sidebar shows
**Components › Button** with three variants. Pick one and change its args in the **Controls**
tab under the canvas.

Add a script to `package.json` so the command is easy to remember:

```json
{ "scripts": { "binbook": "binbook dev" } }
```

## 6. Bring in your CSS

The canvas is an isolated document, so the component renders unstyled until you tell binbook
which stylesheets to load:

```ts
export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [html()],
  styles: ["./src/styles/app.css"],
});
```

The file is served as-is, so point it at built CSS, not a Sass or PostCSS source. See
[Configuration › styles](configuration.md#styles).

## While it runs

Saving the open story's component or story file re-renders it in the canvas. Refresh the browser
after adding a story or changing a story's args or variants, so the sidebar and Controls pick them
up. Changes to `binbook.config.ts` need a restart. [The viewer › Hot reload](viewer.md#hot-reload)
has the details.

## Next

- [Writing stories](stories.md) for every field and control type.
- The page for [your adapter](adapters/README.md).
- [The viewer](viewer.md) for everything the browser UI can do.
- The `examples/` folder in this repository has a working project for each adapter.

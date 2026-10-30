# binbook

binbook is a component workshop for many frameworks. Point it at your components, describe each
one in a small JSON story file, and it gives you a browser UI to browse them, render them in
isolation, change their inputs live and check them for accessibility problems.

It renders plain HTML, React, Vue, Svelte, web components and Lit, Handlebars, Nunjucks and EJS
templates, Astro components, and Razor views, including full Umbraco partials rendered against a
live site. Every framework gets the same viewer and the same story format.

## Quickstart

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-html
```

`binbook.config.ts`:

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import html from "@bgunnarsson/binbook-adapter-html";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [html()],
});
```

`src/button/button.html`:

```html
<button class="btn btn--{{variant}}" {{disabled}}>{{label}}</button>
```

`src/button/button.binbook.json`:

```json
{
  "title": "Components/Button",
  "component": "./button.html",
  "args": {
    "label": { "type": "text", "default": "Click me" },
    "variant": { "type": "select", "options": ["primary", "ghost"], "default": "primary" },
    "disabled": { "type": "boolean", "default": false }
  },
  "stories": [{ "name": "Default", "args": {} }, { "name": "Ghost", "args": { "variant": "ghost" } }]
}
```

```bash
pnpm exec binbook dev
```

Open <http://localhost:6006>. [Getting started](docs/getting-started.md) walks through this in
more detail.

## Documentation

**Using binbook**

- [Getting started](docs/getting-started.md): install, first story, run.
- [Configuration](docs/configuration.md): every `binbook.config.ts` option.
- [Writing stories](docs/stories.md): the `*.binbook.json` format, args and controls, variants.
- [Decorators](docs/decorators.md): wrapping stories in routers, stores and other providers.
- [The viewer](docs/viewer.md): sidebar, viewports, controls, actions, accessibility, themes,
  shareable URLs.
- [Troubleshooting](docs/troubleshooting.md)

**Adapters**: [overview](docs/adapters/README.md)

- [HTML](docs/adapters/html.md) · [React](docs/adapters/react.md) · [Vue](docs/adapters/vue.md) ·
  [Svelte](docs/adapters/svelte.md) · [Web Components](docs/adapters/web-components.md) ·
  [Templates](docs/adapters/templates.md) · [Astro](docs/adapters/astro.md) ·
  [Umbraco](docs/adapters/umbraco.md)

**Extending and contributing**

- [Architecture](docs/architecture.md): packages, the render pipeline, the dev server API.
- [Writing an adapter](docs/writing-an-adapter.md)
- [Contributing](docs/contributing.md): working on binbook itself.

## Packages

| Package | |
| --- | --- |
| [`@bgunnarsson/binbook-core`](packages/core) | Dev server, story discovery and the `binbook` CLI |
| [`@bgunnarsson/binbook-viewer`](packages/viewer) | The browser UI, installed with core |
| [`@bgunnarsson/binbook-types`](packages/types) | Shared TypeScript contracts |
| [`@bgunnarsson/binbook-adapter-html`](packages/adapter-html) | Plain HTML with `{{arg}}` placeholders |
| [`@bgunnarsson/binbook-adapter-react`](packages/adapter-react) | React, server-rendered and hydrated |
| [`@bgunnarsson/binbook-adapter-vue`](packages/adapter-vue) | Vue 3 single-file components, hydrated |
| [`@bgunnarsson/binbook-adapter-svelte`](packages/adapter-svelte) | Svelte 5, hydrated |
| [`@bgunnarsson/binbook-adapter-web-components`](packages/adapter-web-components) | Custom elements and Lit |
| [`@bgunnarsson/binbook-adapter-templates`](packages/adapter-templates) | Handlebars, Nunjucks, EJS, or your own engine |
| [`@bgunnarsson/binbook-adapter-astro`](packages/adapter-astro) | Astro components, rendered by your `astro dev` |
| [`@bgunnarsson/binbook-adapter-umbraco`](packages/adapter-umbraco) | Razor offline, or Umbraco partials and Block Lists live |
| [`@bgunnarsson/binbook-adapter-conformance`](packages/adapter-conformance) | Test suite for adapter authors |

`examples/` has a working project for each adapter.

## License

Source-available, not open source. Copyright (c) 2026 B. Gunnarsson; see [LICENSE](LICENSE) for
the full text. In short: you may read the source, install and run binbook on machines you control,
modify your own copy, and submit pull requests upstream from a fork kept for that purpose. You may
not redistribute it, publish it as a project or package of your own, or run it as a hosted
service. For anything outside that scope, contact the licensor on Twitter/X at
[@bgunnarssonis](https://twitter.com/bgunnarssonis).

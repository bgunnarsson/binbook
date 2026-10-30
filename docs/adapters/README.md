# Adapters

An adapter takes a story and its args and returns HTML for the canvas, plus, for interactive
frameworks, a script that brings that HTML to life. The core, the viewer and the story format are
the same whichever adapter you use.

## Choosing one

| Adapter | Package | Component files | Interactive in the canvas | Decorators |
| --- | --- | --- | --- | --- |
| [HTML](html.md) | `@bgunnarsson/binbook-adapter-html` | `.html` with `{{arg}}` | Through [`scripts`](../configuration.md#scripts) | — |
| [React](react.md) | `@bgunnarsson/binbook-adapter-react` | `.jsx`, `.tsx`, `.js`, `.ts` | Yes, hydrated | Yes |
| [Vue](vue.md) | `@bgunnarsson/binbook-adapter-vue` | `.vue` | Yes, hydrated | Yes |
| [Svelte](svelte.md) | `@bgunnarsson/binbook-adapter-svelte` | `.svelte` | Yes, hydrated | Yes |
| [Web Components](web-components.md) | `@bgunnarsson/binbook-adapter-web-components` | `.js`, `.ts` defining a custom element | Yes, rendered in the browser | — |
| [Templates](templates.md) | `@bgunnarsson/binbook-adapter-templates` | `.hbs`, `.njk`, `.ejs`, or your own | Through `scripts` | — |
| [Astro](astro.md) | `@bgunnarsson/binbook-adapter-astro` | `.astro` | No: markup and styles only | Yes |
| [Umbraco](umbraco.md) | `@bgunnarsson/binbook-adapter-umbraco` | `.cshtml` | Through `scripts` | — |

## How rendering works

For every adapter:

1. The viewer asks the dev server to render a story variant with a set of args.
2. The adapter reads the component file, relative to the story file, and produces HTML.
3. The viewer writes that HTML into a sandboxed iframe, along with your configured `styles`,
   `scripts`, and any client script the adapter returned.

React, Vue and Svelte render on the server first, so the canvas shows real markup straight away,
then ship a bundled copy of the component that hydrates it. Web components ship only the bundle;
the element renders itself in the browser. HTML, Templates, Astro and Umbraco produce markup only.

The client bundle is built with esbuild and contains everything the component needs, framework
runtime included, because the sandboxed frame has no module loader and no access to your dev
server's module graph. Bundles are cached per component and rebuilt when the component file or
its decorators change.

## One adapter per config

Every built-in adapter claims all `*.binbook.json` files, and binbook gives each story to the first
adapter that claims it. A config with `adapters: [react(), vue()]` renders every story with React.

To preview two kinds of component from one repository, give each its own config and run two
servers:

```
packages/
  react-ui/
    binbook.config.ts      // adapters: [react()], port: 6006
  vue-ui/
    binbook.config.ts      // adapters: [vue()],   port: 6007
```

```bash
(cd packages/react-ui && pnpm exec binbook dev) &
(cd packages/vue-ui && pnpm exec binbook dev)
```

## Writing your own

The adapter contract is small: a name, a glob and a `render` function. See
[Writing an adapter](../writing-an-adapter.md).

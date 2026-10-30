# Astro adapter

Renders `.astro` components through your project's own `astro dev`, so a component renders with
the same config, integrations, scoped styles, global CSS and fonts as it does on the site.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-astro
```

It needs Astro 7 or later and Node 22.12 or later.

## How it works

The adapter has two halves:

- An **Astro integration**, added to `astro dev`. It adds a render endpoint and a route that
  renders one component, with its props and decorators, inside a real Astro page. It adds nothing
  outside the dev server.
- The **binbook adapter**, in `binbook.config.ts`. It sends each render to that endpoint and puts
  the returned markup in the canvas, with the component's stylesheets linked from `astro dev`.

Both servers have to be running: `astro dev` for rendering, `binbook dev` for the viewer.

## Setup

### 1. Add the integration to `astro dev`

Keep it out of your production config by giving binbook a config of its own that extends it:

```js
// astro.binbook.config.mjs
import binbook from "@bgunnarsson/binbook-adapter-astro/integration";
import config from "./astro.config.mjs";

export default { ...config, integrations: [...(config.integrations ?? []), binbook()] };
```

```json
{
  "scripts": {
    "dev:binbook": "astro dev --config astro.binbook.config.mjs",
    "binbook": "binbook dev"
  }
}
```

Adding `binbook()` to `astro.config.mjs` itself works too. The integration only acts in `astro dev`.

### 2. Add the adapter to binbook

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import astro from "@bgunnarsson/binbook-adapter-astro";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [astro()],
});
```

| Option | |
| --- | --- |
| `astroUrl` | Where `astro dev` listens. Defaults to `http://localhost:4321` |

### 3. Run both

```bash
pnpm dev:binbook   # astro dev, with the integration
pnpm binbook       # the viewer, on http://localhost:6006
```

## Components

`component` is a `.astro` file relative to the story file, or `./Card.astro#Card` for a named
export. Args become the component's props.

```astro
---
// src/components/Button.astro
interface Props { label: string; variant?: "primary" | "ghost" }
const { label, variant = "primary" } = Astro.props;
---
<button class={`btn btn--${variant}`}>{label}</button>
<style>.btn { padding: 0.75rem 1.25rem; }</style>
```

```json
{
  "title": "Components/Button",
  "component": "./Button.astro",
  "args": {
    "label": { "type": "text", "default": "Click me" },
    "variant": { "type": "select", "options": ["primary", "ghost"], "default": "primary" }
  },
  "stories": [{ "name": "Primary", "args": {} }, { "name": "Ghost", "args": { "variant": "ghost" } }]
}
```

The canvas gets the stylesheets of the component and of every component and stylesheet it
imports, in the order Astro would load them. Root-relative URLs in the markup, such as images
under `/media` or `/_image`, load from `astro dev`.

## Decorators

A decorator is a `.astro` component with a default slot. It is the place for what every story
needs and no single component imports: global CSS and fonts.

```astro
---
// binbook/Frame.astro
import { Font } from "astro:assets";
import "../src/styles/global.css";
---
<Font cssVariable="--font-body" />
<slot />
```

```ts
defineConfig({ /* … */ decorators: ["./binbook/Frame.astro"] });
```

Decorators wrap the component outermost first, and their stylesheets come before the component's.
See [Decorators](../decorators.md).

## The canvas and `astro dev`'s cross-site guard

`astro dev` refuses cross-site requests for scripts, stylesheets and other subresources, so other
pages in your browser cannot read the dev server's transformed source. The canvas is a sandboxed
iframe with an opaque origin, so every request it makes is cross-site, and its requests carry
nothing (no `Origin`, no `Referer`) that tells them from any other page's.

The integration lets a cross-site request past the guard by the kind of request the browser says
it is (`Sec-Fetch-Dest`, which a page cannot set):

| Kind | Passes | |
| --- | --- | --- |
| Stylesheet, image | Yes | A page cannot read a stylesheet or image it loads from another origin |
| Font | Yes, with `Access-Control-Allow-Origin: *` | Fonts load in CORS mode; they are files the site serves to everyone |
| Script, `fetch` and everything else | No | These are how a page would read the source |

This holds only while `astro dev` runs with the integration.

## Limits

- Component `<script>`s do not run in the canvas: they are module scripts, which the guard keeps
  blocking. The adapter leaves them out of the markup. Interactive components show their
  server-rendered state.
- Astro islands (`client:*` directives) do not hydrate in the canvas, for the same reason.
- `astro dev` has to be running. When it is not, the canvas says so.

## Docs and watching

The Code tab and Docs view show the `.astro` file. A story re-renders when its component or story
file is saved; `astro dev` picks up changes to the modules the component imports itself.

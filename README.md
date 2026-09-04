# binbook

binbook is a modern, multi-framework component workshop: point it at your components and story
files and it gives you a live browser UI to browse, render, and interact with them in isolation.
It ships the framework-agnostic core (config, story discovery, dev server, hot reload), an HTML
adapter for plain-markup components, and **Atelier** — a dark, compact viewer UI (JetBrains Mono,
teal accent) with a sidebar tree, live controls, an actions log, in-browser accessibility checks,
a source/code view, docs, viewport presets, and an optional AI assistant.

## Quickstart

binbook is currently developed as a pnpm workspace/monorepo, so the fastest way to try it is to
work the way the bundled example does (`examples/html-sandbox`) rather than installing from a
registry.

### 1. Install

In a real project you'd add:

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-html
```

Inside this monorepo, packages are already linked via `workspace:*` — see
`examples/html-sandbox/package.json`.

### 2. Create `binbook.config.ts`

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import html from "@bgunnarsson/binbook-adapter-html";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [html()],
});
```

### 3. Write a component + story

`src/button/button.html`:

```html
<button class="btn btn--{{variant}}" {{disabled}}>{{label}}</button>
```

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
    { "name": "Ghost", "args": { "variant": "ghost" } }
  ]
}
```

### 4. Run it

```bash
binbook dev
```

Open `http://localhost:6006`.

## Story format

Each component has a matching `*.binbook.json` file next to it:

- **`title`** — drives the sidebar tree; segments split on `/` (e.g. `"Components/Button"` nests
  under a "Components" group).
- **`description`** — shown in the docs view.
- **`component`** — relative path to the component file the adapter renders.
- **`decorators`** — optional list of wrapper module refs (`<file>` or `<file>#<export>`, relative
  to the story file) that wrap the component before render — providers a component needs to render
  in isolation (router, theme, store, i18n). See [Decorators](#decorators).
- **`wrapper`** — optional inline CSS for the preview wrapper the canvas puts around the
  component, so a story can frame itself in isolation (width, padding, max-width…). Either a CSS
  declaration string (`"width: 400px"`) or an object (`{ "maxWidth": "400px", "margin": "0 auto" }`,
  camelCase keys are kebab-cased). A per-variant `wrapper` (see `stories`) overrides the story-level
  one. Applied as `<div class="binbook-wrapper" style="…">` inside the sandboxed canvas.
- **`args`** — the controls panel schema. Each arg has:
  - `type`: `"text" | "select" | "boolean" | "number" | "color"`
  - `default`: the initial value
  - `options`: string list, required for `"select"`
- **`stories`** — an array of named variants, each with a partial `args` object that overrides
  the defaults for that story, and an optional `wrapper` that overrides the story-level `wrapper`
  for just that variant.

The HTML adapter interpolates `{{arg}}` placeholders in the component template against the
resolved args (story args merged over defaults). Boolean args have attribute semantics: a `true`
value renders the bare attribute name (e.g. `{{disabled}}` → `disabled`), and `false` renders
nothing.

## Decorators

Components that consume context — a router (`<Link>`, `useNavigate`), a theme/i18n/store provider,
React Query — can't render standalone. **Decorators** wrap a story in those providers. This is what
lets components from meta-frameworks like **Remix** or **TanStack Start** render: they're ordinary
React components, they just need their provider(s) supplied.

A decorator is a module that renders its `children`:

```tsx
// src/decorators/withRouter.tsx
import { MemoryRouter } from "react-router-dom";
export default function withRouter({ children }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}
```

Reference it per story (relative to the story file) or globally in `binbook.config.ts`:

```json
{ "title": "Components/Nav", "component": "./Nav.tsx", "decorators": ["../decorators/withRouter.tsx"] }
```

```ts
export default defineConfig({ /* … */ decorators: ["./src/decorators/withTheme.tsx"] });
```

Global decorators wrap outermost, the story's own nest inside. Each ref may name an export with
`<file>#<Name>` (defaults to the default export). Decorators are composed for **both** SSR and
hydration, so the markup matches.

Supported by the **React**, **Vue**, and **Svelte** adapters — a decorator is written in the same
framework as its stories (a React component taking `children`; a Vue SFC with `<slot />`; a Svelte
component that `{@render children()}`). Ready-made references live in the example sandboxes:
`react-sandbox` ships `withRouter` (react-router) and `withQueryClient` (TanStack Query);
`vue-sandbox` and `svelte-sandbox` show context providers.

Server-only route modules — Remix `loader`s, TanStack Start `createServerFn` — should stay out of
previewed components; mock their data via a decorator.

## Viewer features (Atelier)

- Collapsible sidebar tree with a `/` fuzzy filter and a `⌘K` command palette
- Segmented viewport control (responsive / 390 / 768 / 1280) with a dotted-grid, framed canvas
- A work panel (dockable below the canvas or to the right, via the toggle on its tab bar) with four tabs:
  - **Controls** — live widgets bound to story args (text, switch, select/radio, range, color)
  - **Actions** — a log of DOM events captured from the sandboxed story iframe
  - **Accessibility** — [axe-core](https://github.com/dequelabs/axe-core) runs *inside* the story
    iframe (the sandbox stays intact) and reports violations
  - **Code** — the story source with copy-to-clipboard
- **Docs** view: description, a props table, a live preview, and usage source
- **Shareable URLs**: the selected story, variant, live args, and viewport round-trip through the
  query string (`?story=…&v=…&vp=…&args=…`), so links survive a refresh and browser Back/Forward
  walks between stories
- An optional **AI assistant** (floating panel) that answers questions about the selected component

Every story renders in a `sandbox="allow-scripts"` iframe, so binbook's own React runtime never
collides with the component under test — the same isolation boundary that lets HTML, React, and
Umbraco adapters share one viewer.

### AI assistant (optional)

The assistant is backed by a `/api/chat` endpoint in the dev server that proxies the
[Anthropic API](https://docs.anthropic.com). Set `ANTHROPIC_API_KEY` in the environment where you
run `binbook dev` to enable it:

```bash
ANTHROPIC_API_KEY=sk-ant-... binbook dev
```

Without the key, the assistant panel still opens but prompts you to configure it — nothing else in
the viewer is affected.

## Architecture

binbook is a **pnpm workspace monorepo**. A framework-agnostic core (config, story
discovery, dev server) sits in the middle; pluggable **adapters** teach it to render a
given framework, and the **viewer** is the browser UI the core serves. Everything is
wired together through the shared type contracts in `@bgunnarsson/binbook-types`.

### Packages

| Package | Name | Responsibility |
| --- | --- | --- |
| `packages/core` | `@bgunnarsson/binbook-core` | Config loading, story discovery + arg resolution, adapter registry, the Vite-based dev server (REST endpoints + WebSocket hot reload + AI chat proxy), and the `binbook` CLI |
| `packages/viewer` | `@bgunnarsson/binbook-viewer` | **Atelier** — the browser UI (sidebar tree, sandboxed canvas, controls, actions, a11y, docs), a React SPA served by the dev server |
| `packages/types` | `@bgunnarsson/binbook-types` | Shared TypeScript contracts: `ArgType`, story/config schemas, the adapter interface, and the sidebar-tree types |
| `packages/adapter-html` | `@bgunnarsson/binbook-adapter-html` | Renders plain-markup components with `{{arg}}` interpolation (zero runtime deps) |
| `packages/adapter-react` | `@bgunnarsson/binbook-adapter-react` | Server-renders React components and ships a client bundle that **hydrates** them for interactivity (esbuild; `react`/`react-dom` peer deps; `react({ hydrate: false })` for static-only) |
| `packages/adapter-umbraco` | `@bgunnarsson/binbook-adapter-umbraco` | Renders full Umbraco partials and Block List blocks against a live site's render endpoint (`live` mode), plus an `offline` mode that renders plain .NET Razor components — Tag Helpers, layouts, partials — via a bundled .NET 8 host running the real ASP.NET Core MVC Razor engine |
| `packages/adapter-templates` | `@bgunnarsson/binbook-adapter-templates` | The "templates family": one adapter, a pluggable engine — built-in Handlebars/Nunjucks/EJS (optional peer deps), or bring your own `TemplateEngine`. Mix engines and resolve by file extension |
| `packages/adapter-svelte` | `@bgunnarsson/binbook-adapter-svelte` | Server-renders Svelte 5 components (via `svelte/compiler` + `svelte/server`) and ships a client bundle that **hydrates** them for interactivity (`svelte` peer dep; `svelte({ hydrate: false })` for static-only) |
| `packages/adapter-web-components` | `@bgunnarsson/binbook-adapter-web-components` | Renders custom elements — vanilla or **Lit** — live in the sandboxed canvas: the story markup is the element tag with args as attributes, and a `clientScript` bundle (Lit bundled in when used) defines it (`lit` optional peer dep) |
| `packages/adapter-vue` | `@bgunnarsson/binbook-adapter-vue` | Server-renders Vue 3 SFCs (via `vue/compiler-sfc` + `vue/server-renderer`, scoped styles included) and ships a client bundle that **hydrates** them (`vue` peer dep; `vue({ hydrate: false })` for static-only) |
| `packages/adapter-conformance` | `@bgunnarsson/binbook-adapter-conformance` | Shared Vitest suite every adapter runs against to prove it satisfies the adapter contract |
| `examples/*` | — | Working sandboxes wired to each adapter: `html-sandbox`, `react-sandbox`, `umbraco-sandbox`, `templates-sandbox`, `svelte-sandbox`, `wc-sandbox`, `vue-sandbox` |

### How a story renders

1. `binbook dev` (core CLI) registers a `tsx` ESM loader and imports `binbook.config.ts`.
2. Core discovers `*.binbook.json` stories with `fast-glob`, validates them with `zod`,
   and builds the sidebar tree.
3. Core boots a **Vite dev server in middleware mode** exposing REST endpoints
   (`/api/stories`, `/api/render`, `/api/config`, `/api/docs`, `/api/chat`) and a
   WebSocket (`/__binbook_ws`) for hot reload.
4. The viewer (React SPA) fetches the catalog, then asks the matching adapter — via
   `/api/render` — for the HTML of the selected story + args.
5. That HTML is injected into a `sandbox="allow-scripts"` iframe, so component runtimes
   are fully isolated from binbook's own React runtime — the boundary that lets HTML,
   React, and Umbraco share one viewer. An adapter may also return `clientScript` — an
   inline, self-contained bundle the viewer runs inside the frame to **hydrate** the
   markup, so stateful components (local state, effects, event handlers) are live in the
   canvas. Per-render args reach it via `window.__BINBOOK_ARGS__`.
6. A file change pushes a `reload` message over the WebSocket; the viewer re-renders the
   active story.
7. When `ANTHROPIC_API_KEY` is set, `/api/chat` proxies the Anthropic API to power the
   optional AI assistant.

Adapters are decoupled from the core through the interface in
`@bgunnarsson/binbook-types`; each is verified against the shared
`adapter-conformance` kit, so adding a new framework means writing one adapter — not
touching the core or viewer.

## Tech stack

- **Language & build** — TypeScript 5 (ESM, `strict`, bundler resolution), Node ≥ 20,
  [Vite](https://vitejs.dev) 5, [tsx](https://github.com/privatenumber/tsx) (TS config/component loading), [esbuild](https://esbuild.github.io) (React bundling)
- **Monorepo & release** — [pnpm](https://pnpm.io) workspaces, [Changesets](https://github.com/changesets/changesets) (versioning + publishing)
- **Core / dev server** — Vite (middleware mode), [`ws`](https://github.com/websockets/ws) (WebSocket hot reload), [`fast-glob`](https://github.com/mrmlnc/fast-glob) + [`minimatch`](https://github.com/isaacs/minimatch) (story discovery), [`zod`](https://zod.dev) (story/config validation), [`@anthropic-ai/sdk`](https://github.com/anthropics/anthropic-sdk-typescript) (AI assistant proxy)
- **Viewer (Atelier)** — [React](https://react.dev) 19, [Zustand](https://github.com/pmndrs/zustand) (state), [Tailwind CSS](https://tailwindcss.com) 3 + PostCSS/autoprefixer, [axe-core](https://github.com/dequelabs/axe-core) (in-iframe a11y), JetBrains Mono
- **Adapters** — HTML (`{{arg}}` interpolation, zero-dep) · React (esbuild + `react`/`react-dom` peers, hydrates) · [Vue](https://vuejs.org) 3 (`vue/compiler-sfc` + esbuild, hydrates) · [Svelte](https://svelte.dev) 5 (`svelte/compiler` + esbuild, hydrates) · [Web Components](https://developer.mozilla.org/en-US/docs/Web/API/Web_components) / [Lit](https://lit.dev) (esbuild, custom elements live in the canvas) · Umbraco (full Umbraco partials + Block List blocks against a live site, or plain Razor — Tag Helpers + partials — offline via a .NET 8 host running the ASP.NET Core MVC Razor engine) · Templates ([Handlebars](https://handlebarsjs.com) / [Nunjucks](https://mozilla.github.io/nunjucks/) / [EJS](https://ejs.co), pluggable, optional peers)
- **Testing** — [Vitest](https://vitest.dev) 3 (separate `node` and `jsdom` projects), [Testing Library](https://testing-library.com) + jsdom (viewer), [Playwright](https://playwright.dev) (end-to-end), and the `adapter-conformance` kit

## Scripts

Run from the repo root:

```bash
pnpm test       # unit + integration tests (vitest)
pnpm typecheck  # type-checks all five packages with tsc --noEmit
pnpm test:e2e   # Playwright, across every sandbox — starts its own dev servers
```

`test:e2e` needs the Playwright browsers: `pnpm exec playwright install chromium`
once. It boots one dev server per sandbox itself (see `e2e/ports.ts`), so there
is nothing else to have running.

## License

[Apache License 2.0](LICENSE) — see [`NOTICE`](NOTICE). Copyright © 2026 bgunnarsson.
Includes an explicit patent grant; permissive and npm-friendly.

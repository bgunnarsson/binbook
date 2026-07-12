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
- **`args`** — the controls panel schema. Each arg has:
  - `type`: `"text" | "select" | "boolean" | "number" | "color"`
  - `default`: the initial value
  - `options`: string list, required for `"select"`
- **`stories`** — an array of named variants, each with a partial `args` object that overrides
  the defaults for that story.

The HTML adapter interpolates `{{arg}}` placeholders in the component template against the
resolved args (story args merged over defaults). Boolean args have attribute semantics: a `true`
value renders the bare attribute name (e.g. `{{disabled}}` → `disabled`), and `false` renders
nothing.

## Viewer features (Atelier)

- Collapsible sidebar tree with a `/` fuzzy filter and a `⌘K` command palette
- Segmented viewport control (responsive / 390 / 768 / 1280) with a dotted-grid, framed canvas
- A bottom work panel with four tabs:
  - **Controls** — live widgets bound to story args (text, switch, select/radio, range, color)
  - **Actions** — a log of DOM events captured from the sandboxed story iframe
  - **Accessibility** — [axe-core](https://github.com/dequelabs/axe-core) runs *inside* the story
    iframe (the sandbox stays intact) and reports violations
  - **Code** — the story source with copy-to-clipboard
- **Docs** view: description, a props table, a live preview, and usage source
- An optional **AI assistant** (floating panel) that answers questions about the selected component

Every story renders in a `sandbox="allow-scripts"` iframe, so binbook's own React runtime never
collides with the component under test — the same isolation boundary that lets HTML, React, and
Razor adapters share one viewer.

### AI assistant (optional)

The assistant is backed by a `/api/chat` endpoint in the dev server that proxies the
[Anthropic API](https://docs.anthropic.com). Set `ANTHROPIC_API_KEY` in the environment where you
run `binbook dev` to enable it:

```bash
ANTHROPIC_API_KEY=sk-ant-... binbook dev
```

Without the key, the assistant panel still opens but prompts you to configure it — nothing else in
the viewer is affected.

## Monorepo layout

- `packages/core` (`@bgunnarsson/binbook-core`) — config loading, story discovery, dev server, hot reload, CLI (`binbook dev`)
- `packages/viewer` (`@bgunnarsson/binbook-viewer`) — the browser UI (sidebar, controls, canvas, docs)
- `packages/adapter-html` (`@bgunnarsson/binbook-adapter-html`) — renders plain HTML components with `{{arg}}` interpolation
- `packages/adapter-conformance` (`@bgunnarsson/binbook-adapter-conformance`) — a shared test suite adapters run against to verify they implement the adapter contract
- `packages/types` (`@bgunnarsson/binbook-types`) — shared TypeScript types (`ArgType`, story/config schemas, adapter interface)
- `examples/html-sandbox` — a working example project wired up with the HTML adapter

## Scripts

Run from the repo root:

```bash
pnpm test       # unit + integration tests (vitest)
pnpm typecheck  # type-checks all five packages with tsc --noEmit
pnpm e2e        # Playwright end-to-end tests against the viewer
```

# Binbook — Design Spec

**Status:** Draft for review
**Date:** 2026-07-12
**Working title:** binbook

## Summary

Binbook is a modern alternative to Storybook: a component workshop for building,
viewing, and documenting UI components in isolation. It targets multiple frontend
frameworks — and non-frameworks — starting with **HTML**, then **React** and
**Razor**. The goals are less bloat, better visual design, and better DX than
Storybook.

The v1 milestone is a single vertical slice: the **HTML adapter** on a
framework-agnostic core, proving the full loop (discover stories → adapter renders
→ viewer displays → hot reload) before React and Razor are layered on.

## Goals & Non-Goals

### Goals
- A framework-agnostic core that treats each framework through a single adapter
  interface, so adding a framework never modifies core.
- Native rendering per framework: each adapter renders in its own ecosystem's
  natural way (HTML interpolates, React renders client-side, Razor renders
  server-side in .NET).
- A unified, simple story-definition format shared across all frameworks.
- A clean, modern viewer UI — a deliberate departure from Storybook's dated look
  and bloat.
- Tight, opinionated v1 feature set.

### Non-Goals (v1)
- React and Razor adapters (architecture must accommodate them; they are not built
  in v1).
- Dark mode / canvas backgrounds (build design tokens so it is a later toggle, not
  a rewrite).
- Isolate/fullscreen + copy-source.
- Addon ecosystem / plugin marketplace.
- Auto-detection of adapters (adapters are explicitly registered in config).

## Audience & Positioning

Internal-first: an opinionated tool for the author's own team workflow (heavy
Vettvangur Razor + React usage), designed from the start to be open-sourced once
proven. Opinionated defaults are acceptable in v1 provided they do not bake in
assumptions that block later generalization.

## Architecture

Three conceptual layers:

```
┌─────────────────────────────────────────────┐
│  Viewer (browser app: React + Tailwind)      │  sidebar · canvas · controls · viewport · docs
├─────────────────────────────────────────────┤
│  Core (Node: CLI + Vite dev server)          │  story discovery · adapter orchestration · HMR bus
├─────────────────────────────────────────────┤
│  Adapters (one per framework)                │  binbook-adapter-html  →  React, Razor later
└─────────────────────────────────────────────┘
```

**Canvas isolation — load-bearing decision:** the viewer never renders adapter
output inline. Every story renders into a **sandboxed iframe**. This keeps
binbook's own React runtime from ever colliding with a story's framework, and it
makes the adapter model behave identically for HTML today and Razor later.

### Tech stack

- **Core / dev server:** Node, built on Vite's programmatic API (HMR, transforms).
- **Viewer:** React + Tailwind.
- **Language:** TypeScript throughout.
- **Testing:** Vitest (unit/integration) + Playwright (e2e).

### Monorepo packages (v1)

pnpm workspace. All packages under the `@bgunnarsson` scope (npm scopes are
single-level, so the `binbook-` prefix is part of the package name).

| Package | Role |
|---|---|
| `@bgunnarsson/binbook-core` | CLI (`binbook` bin), Vite dev server, story discovery, adapter registry, HMR/websocket bus, arg resolution |
| `@bgunnarsson/binbook-viewer` | React + Tailwind browser UI (sidebar, canvas iframe host, controls, viewport, docs) |
| `@bgunnarsson/binbook-adapter-html` | The first adapter: HTML story rendering via `{{arg}}` interpolation |
| `@bgunnarsson/binbook-types` | Shared TS contracts (Story, Adapter, Arg, RenderContext, RenderResult, DocsMeta) |
| `examples/html-sandbox` | A real HTML component library used as the dogfood / e2e target |

Future adapters follow the naming convention `@bgunnarsson/binbook-adapter-<framework>`.

## Story Format (unified)

A story is a `.binbook.json` file, discovered by glob. The **definition is unified
across all frameworks**; only the render target and how args are applied differ per
adapter.

```json
{
  "title": "Components/Button",
  "description": "Primary call-to-action button.",
  "component": "./button.html",
  "args": {
    "label":    { "type": "text",    "default": "Click me" },
    "variant":  { "type": "select",  "options": ["primary", "secondary", "ghost"], "default": "primary" },
    "disabled": { "type": "boolean", "default": false }
  },
  "stories": [
    { "name": "Default", "args": {} },
    { "name": "Ghost",   "args": { "variant": "ghost" } }
  ]
}
```

### Unified fields (core owns; every framework shares)
- `title` — drives the sidebar tree via `/`-separated path segments.
- `description` — shown in the docs view.
- `args` — the controls-panel schema. Arg types in v1: `text`, `select`
  (with `options`), `boolean`, `number`, `color`.
- `stories` — named variants; each may override args via its own `args` object.

### Framework-specific (adapter owns)
- `component` — the render target string. Core never interprets it; it is passed
  verbatim to the adapter. HTML → an `.html` file path; React (later) →
  `"./Button.tsx#Button"`; Razor (later) → a partial path.
- **How args become output.** For the HTML adapter, the component is a plain,
  ordinary `.html` file (no custom tags) using lightweight `{{arg}}` placeholders:

```html
<!-- button.html -->
<button class="btn btn--{{variant}}" {{disabled}}>{{label}}</button>
```

The `{{arg}}` interpolation is the HTML adapter's only "magic" and is invisible to
core and to other frameworks. It must support:
- value substitution (`{{label}}`, `{{variant}}`);
- boolean attributes (a `true` boolean like `disabled` renders the bare attribute;
  `false` renders nothing);
- HTML-escaping of interpolated values to prevent XSS from arg input.

## Adapter Contract

The single interface core depends on. Getting this right means React and Razor slot
in without touching core.

```ts
interface Adapter {
  name: string;                          // "html"
  storyGlob: string;                     // "**/*.binbook.json"

  // Resolve a component ref + args into something the iframe can display.
  render(ctx: RenderContext): Promise<RenderResult>;

  // Watch dependencies of a story so core can trigger hot reload.
  watch?(story: Story, onChange: () => void): Dispose;

  // Optional: extract docs metadata (e.g. source snippet) for the docs view.
  docs?(story: Story): Promise<DocsMeta>;
}

interface RenderContext {
  story: Story;                    // parsed from the .binbook.json
  component: string;               // the raw "component" string, adapter-interpreted
  args: Record<string, unknown>;   // fully resolved args (defaults + variant + live edits)
  root: string;                    // project root for resolving paths
}

interface RenderResult {
  html: string;                    // fully-rendered HTML to inject into the canvas iframe
  assets?: string[];               // css/js the iframe must load (e.g. the component's stylesheet)
}
```

### Deliberate choices
- **`render` returns an HTML string, not a component.** This is why one iframe
  pipeline works for every framework: React will render-to-string client-side,
  Razor will render server-side via its .NET process, HTML interpolates. Core never
  knows the difference.
- **Arg resolution happens in core, not the adapter.** Core computes final args
  (adapter-declared defaults → variant overrides → live edits from the controls
  panel) and hands the adapter a finished `args` object. Every framework therefore
  gets identical arg semantics for free; the adapter only consumes final args.

### End-to-end flow

```
1. Core discovers *.binbook.json          → builds the unified story tree
2. Viewer requests story "Button/Ghost" with live args
3. Core resolves args, routes to the html adapter's render()
4. HTML adapter: reads button.html, interpolates {{args}}  → RenderResult
5. Core serves that HTML into the canvas iframe (+ assets)
6. User edits an arg in the controls panel
7. Viewer re-requests render with new args → back to step 3 (no reload)
8. File change on disk → adapter.watch fires → core pushes HMR → viewer re-fetches → iframe swaps
```

## Viewer UI

```
┌──────────────┬──────────────────────────────────────────────┐
│              │  Toolbar:  [Canvas | Docs]   ⟷ viewport ▾   ⌕  │
│   Sidebar    ├──────────────────────────────────────────────┤
│   (tree)     │                                              │
│              │            Canvas  (story iframe)            │
│  Components  │                                              │
│  ▸ Button    │                                              │
│    Default   ├──────────────────────────────────────────────┤
│    Ghost     │  Controls:  label [Buy    ] variant [ghost▾] │
│  ▸ Card      │             disabled [✓]                     │
└──────────────┴──────────────────────────────────────────────┘
```

### Regions
- **Sidebar** — story tree built from `title` paths (`Components/Button` →
  `Components ▸ Button ▸ [Default, Ghost]`). Fuzzy filter at top. Collapsible
  groups. Keyboard nav (↑↓ to move between stories, `/` to focus search).
- **Canvas** — the sandboxed story iframe, with a toolbar above:
  - **Canvas / Docs** tab toggle (feature #4).
  - **Viewport** dropdown (feature #2) — presets (Mobile 375, Tablet 768,
    Desktop 1280, Full) plus responsive drag-resize. Implemented purely by setting
    iframe width/height.
  - Search icon / command palette (`⌘K`) for jump-to-story.
- **Controls panel** (feature #1) — auto-generated from the story's `args` schema.
  Widget per arg type: text→input, select→dropdown, boolean→checkbox,
  number→stepper, color→swatch. Editing an arg pushes new args and re-renders
  (the step 6/7 loop). A "Reset" action restores defaults.
  - **Dock toggle:** the user can dock the controls panel at the **bottom** or on
    the **right**. The choice is persisted to local settings.

### Docs view (feature #4)
When the Docs tab is active, the canvas region shows an auto-generated page derived
entirely from the manifest + adapter — no authoring required:
- the `description`;
- the args table (name / type / default);
- a live preview of each variant;
- a source snippet from `adapter.docs()`.

### Design language
A deliberate departure from Storybook: clean, high-contrast, generous whitespace, a
single accent color, system font stack, subtle motion — implemented with Tailwind.
Design tokens are structured so that dark mode (deferred) becomes a later toggle
rather than a rewrite.

## Configuration & Dev Server

### Config file — `binbook.config.ts` at project root

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import html from "@bgunnarsson/binbook-adapter-html";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [html()],
  // future: theme, port, staticDirs
});
```

Adapters are explicit and registered here — this is how core stays
framework-agnostic (no magic auto-detection) and how future frameworks are added:
`pnpm add` + one line.

### Dev server wiring
- `binbook dev` boots a Vite server that serves the **viewer** app (its own React
  bundle).
- Core exposes a small API the viewer calls:
  - `GET /api/stories` — the story tree.
  - `POST /api/render` — `{ component, args }` → `RenderResult`.
  - A websocket channel for HMR pushes.
- The **canvas iframe** loads `/api/render` output at a sandboxed route, isolated
  from the viewer's React runtime.
- `adapter.watch()` → file change → core pushes over the websocket → viewer
  re-fetches → iframe swaps. Args-only edits skip disk and just re-`POST /api/render`.

## Testing Strategy

| Layer | Tool | What's covered |
|---|---|---|
| Story parsing & arg resolution (defaults → variant → live) | Vitest unit | Core's pure logic — highest-value, most-reused code |
| HTML adapter interpolation (`{{arg}}`, booleans, escaping) | Vitest unit | Adapter contract compliance, XSS-safe escaping |
| Adapter contract conformance | Vitest (shared test kit) | A reusable suite any future adapter runs against — React/Razor prove themselves against the same tests |
| Dev server API (`/api/stories`, `/api/render`) | Vitest integration | Discovery → render round-trip |
| Viewer end-to-end (pick story → edit control → canvas updates) | Playwright | The real user loop against `examples/html-sandbox` |

The **shared adapter conformance kit** is strategic: it turns "does this adapter
behave?" into a runnable test suite, so onboarding React and Razor later is "make
these tests pass" rather than "hope it integrates."

## Milestones

1. **v1 (this spec):** Core + HTML adapter + viewer, with core loop, controls/args
   (#1), viewport toggles (#2), and docs view (#4), dogfooded against
   `examples/html-sandbox`.
2. **Later:** React adapter (against the conformance kit), then Razor adapter
   (polyglot: core orchestrates a .NET render process). Dark mode/backgrounds,
   isolate/fullscreen + copy-source.

## Open Questions / Risks

- **Razor rendering (future):** the adapter must render via a running .NET process;
  core orchestrates but does not embed .NET. The `render → HTML string` contract is
  designed to absorb this, but the process lifecycle (spawn, proxy, watch) needs its
  own design when that milestone arrives.
- **Asset handling:** `RenderResult.assets` must resolve component CSS/JS into the
  iframe correctly; the exact resolution mechanism (Vite-served vs. inlined) is an
  implementation detail to settle in the plan.
- **`{{arg}}` templating scope:** intentionally minimal (interpolation + boolean
  attributes + escaping). Resist growth into a full template engine.

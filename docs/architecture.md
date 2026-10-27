# Architecture

binbook has three parts: a **core** that finds stories and runs the dev server, **adapters** that
render components, and the **viewer**, the browser UI. They share one set of TypeScript contracts
in `@bgunnarsson/binbook-types`, so the core and viewer know nothing about any framework, and a new
framework needs only a new adapter.

## Packages

| Package | |
| --- | --- |
| `@bgunnarsson/binbook-core` | Config loading, story discovery and validation, arg resolution, adapter selection, the Vite-based dev server, and the `binbook` CLI |
| `@bgunnarsson/binbook-viewer` | The browser UI: a React app the dev server serves |
| `@bgunnarsson/binbook-types` | Shared types: story and config shapes, the `Adapter` interface, the sidebar tree |
| `@bgunnarsson/binbook-adapter-html` | `{{arg}}` HTML templates |
| `@bgunnarsson/binbook-adapter-react` | React, server-rendered and hydrated |
| `@bgunnarsson/binbook-adapter-vue` | Vue 3 SFCs, server-rendered and hydrated |
| `@bgunnarsson/binbook-adapter-svelte` | Svelte 5, server-rendered and hydrated |
| `@bgunnarsson/binbook-adapter-web-components` | Custom elements and Lit |
| `@bgunnarsson/binbook-adapter-templates` | Handlebars, Nunjucks, EJS, or a custom engine |
| `@bgunnarsson/binbook-adapter-umbraco` | Razor offline through a bundled .NET host, or Umbraco live through a site endpoint |
| `@bgunnarsson/binbook-adapter-conformance` | The Vitest suite every adapter runs to prove it meets the contract |

The packages ship TypeScript source, not compiled JavaScript. The CLI registers
[tsx](https://github.com/privatenumber/tsx) before loading anything, so the core, the adapters and
your config run as TypeScript without a build step.

## How a story renders

1. `binbook dev` registers tsx and imports `binbook.config.ts` from the current directory.
2. The core finds story files with [fast-glob](https://github.com/mrmlnc/fast-glob), validates each
   with [zod](https://zod.dev), and skips invalid ones with a warning.
3. Each story goes through its adapter's optional `expand` hook. The Umbraco adapter uses it to turn
   one Block List manifest into a story per block.
4. The core starts [Vite](https://vitejs.dev) with the viewer as its root and a plugin that adds
   binbook's API routes and a WebSocket for reloads.
5. The viewer fetches the story list and builds the sidebar.
6. When you pick a variant, the viewer posts the story id, variant name and any changed args to
   `/api/render`. The core resolves the final args (your changes, then the variant's, then the
   defaults), resolves decorator paths, and calls the adapter's `render`.
7. The adapter returns HTML, and optionally a client script and a base URL. The viewer builds a
   document from them, adds your configured `styles` and `scripts` and its own event and
   accessibility hooks, and loads it into a sandboxed iframe.
8. When a watched file changes, the core re-discovers stories and sends `reload` over the
   WebSocket; the viewer renders the open story again.

## The canvas sandbox

Stories render in an `<iframe sandbox="allow-scripts">` loaded from `srcdoc`. The frame has an
opaque origin, so:

- the story cannot reach the viewer's DOM, cookies or storage;
- the viewer's React and CSS cannot interfere with the story's, which is what lets React, Vue and
  plain HTML share one viewer;
- the story talks to the viewer only through `postMessage`: DOM events for the Actions tab and axe
  results for the Accessibility tab.

Because the frame has no origin of its own, binbook serves configured styles and scripts at
absolute URLs, scripts with `Access-Control-Allow-Origin: *` so module loading works. An adapter's
client script is inlined as a single self-contained bundle, and per-render args reach it on
`window.__BINBOOK_ARGS__`, which keeps the bundle the same for every arg combination and so
cacheable.

## The dev server API

The viewer is the only intended client, but the routes are plain HTTP if you want to script
against them.

| Route | Method | Body | Returns |
| --- | --- | --- | --- |
| `/api/stories` | `GET` | — | `{ tree, stories }` |
| `/api/render` | `POST` | `{ storyId, variant, args }` | `{ html, clientScript?, baseHref?, assets? }` |
| `/api/docs` | `POST` | `{ storyId }` | `{ source? }` |
| `/api/config` | `GET` | — | `{ background, styles, scripts }` |
| `/__binbook_ws` | WebSocket | — | `reload` messages |
| `/__binbook_style/<i>.css` | `GET` | — | The *i*th configured stylesheet |
| `/__binbook_script/<i>/<file>` | `GET` | — | A file from the *i*th configured script's directory |

`POST` routes need `Content-Type: application/json`. Every `/api/*` route refuses requests whose
`Host` is not `localhost`, a `*.localhost` name or an IP address (403), browser requests whose
`Origin` does not match the `Host` (403), the wrong method (405) and other content types (415).
These checks keep a web page in another tab, or a DNS-rebinding attack, from making the server run
your project's code.

```bash
curl -s localhost:6006/api/render \
  -H 'content-type: application/json' \
  -d '{"storyId":"components-button","variant":"Default","args":{"label":"Hi"}}'
```

## Adapter selection

Each adapter has a `storyGlob`. For each story, the core takes the first adapter whose glob matches
the story file's path, and falls back to the first adapter. The built-in adapters all use
`**/*.binbook.json`, so in practice the first adapter renders everything.

## Tech stack

- TypeScript 5 (ESM, strict), Node 20+, run through tsx.
- Core: Vite 5 in middleware mode, `ws`, fast-glob, minimatch, zod.
- Viewer: React 19, Zustand, Tailwind CSS 3, axe-core.
- Adapters: esbuild for component and client bundles; `react-dom/server`, `vue/compiler-sfc` and
  `vue/server-renderer`, `svelte/compiler` and `svelte/server`; an ASP.NET Core 8 Razor host for
  Umbraco offline mode.
- Tests: Vitest, Testing Library with jsdom, Playwright, and the adapter conformance suite.
- Releases: pnpm workspaces and Changesets.

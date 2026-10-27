# Writing an adapter

An adapter is a function that returns an object implementing `Adapter` from
`@bgunnarsson/binbook-types`. It can live in your project, next to `binbook.config.ts`, or be
published as a package. The core and viewer need no changes for a new framework.

## The interface

```ts
interface Adapter {
  name: string;
  storyGlob: string;
  render(ctx: RenderContext): Promise<RenderResult>;
  watch?(story: Story, onChange: () => void): Dispose;
  docs?(story: Story): Promise<DocsMeta>;
  expand?(story: Story): Promise<Story[]>;
}
```

| Member | |
| --- | --- |
| `name` | Identifies the adapter, e.g. `"html"` |
| `storyGlob` | Glob for the story files this adapter handles. See [Selection](#selection) |
| `render` | Turns a story and its resolved args into HTML. Required |
| `watch` | Watches a story's files and calls `onChange` when they change. Returns a function that stops watching |
| `docs` | Returns `{ source }` for the Code tab and the Docs view |
| `expand` | Replaces one discovered story with zero or more computed stories |

### `render`

```ts
interface RenderContext {
  story: Story;            // the parsed story file
  component: string;       // story.component, as written
  args: Record<string, unknown>; // final args: user changes > variant > defaults
  root: string;            // absolute project root
  decorators?: string[];   // absolute decorator refs, outermost first, each maybe "#export"
}

interface RenderResult {
  html: string;
  clientScript?: string;
  baseHref?: string;
  assets?: string[];
}
```

- `component` is as written in the story file. Resolve it against `path.dirname(ctx.story.file)`.
- `args` holds exactly the story's declared args, already resolved.
- `html` is inserted into the canvas document's body.
- `clientScript` is inlined as a classic `<script>` after the markup. The canvas has an opaque
  origin and no module loader, so this must be one self-contained bundle, typically an esbuild IIFE
  containing the framework runtime and the component. Read per-render data from a global you set in
  `html`, as the built-in adapters do with `window.__BINBOOK_ARGS__`, so the bundle does not change
  with the args and can be cached.
- `baseHref` becomes the canvas document's `<base href>`, for markup with root-relative URLs that
  belong to another origin.
- `assets` are extra stylesheet (`.css`) or module script URLs to load into the canvas.

Throw on failure. The message becomes the render error.

`render` must be deterministic: the same args produce the same HTML. Different args should produce
different HTML. The conformance suite checks both.

### `watch`

Watch the component and the story file, and call `onChange` on any change. The core re-discovers
stories, re-subscribes every watcher and tells the viewer to re-render.

```ts
watch(story, onChange) {
  const file = path.resolve(path.dirname(story.file), story.component);
  const a = fs.watch(file, () => onChange());
  const b = fs.watch(story.file, () => onChange());
  return () => { a.close(); b.close(); };
},
```

Without `watch`, stories still render; they just do not hot-reload.

### `docs`

Return the component's source as `{ source }`. Without it, the Code tab and Usage section are empty.

### `expand`

Called once per discovered story, before the catalog is served. Return `[story]` to keep it, a
different list to replace it, or `[]` to drop it. It may do I/O: the Umbraco adapter queries the
live site here. If it throws, only that story is dropped and a warning is logged.

## Selection

For each story, the core uses the first adapter whose `storyGlob` matches the story file path
(minimatch with `matchBase`), and falls back to the first adapter if none match. A narrower glob,
say `**/*.solid.binbook.json`, lets your adapter sit alongside another in one config, as long as
yours comes first in `adapters`.

## A complete example

An adapter for [Mustache](https://github.com/janl/mustache.js) templates:

```ts
// binbook/mustache-adapter.ts
import { readFile } from "node:fs/promises";
import { watch } from "node:fs";
import path from "node:path";
import Mustache from "mustache";
import type { Adapter, Story } from "@bgunnarsson/binbook-types";

const fileOf = (story: Story) => path.resolve(path.dirname(story.file), story.component);

export function mustache(): Adapter {
  return {
    name: "mustache",
    storyGlob: "**/*.binbook.json",

    async render(ctx) {
      const template = await readFile(fileOf(ctx.story), "utf8");
      return { html: Mustache.render(template, ctx.args) };
    },

    watch(story, onChange) {
      const a = watch(fileOf(story), () => onChange());
      const b = watch(story.file, () => onChange());
      return () => {
        a.close();
        b.close();
      };
    },

    async docs(story) {
      return { source: await readFile(fileOf(story), "utf8") };
    },
  };
}
```

```ts
// binbook.config.ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import { mustache } from "./binbook/mustache-adapter";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [mustache()],
});
```

For a framework with client-side behaviour, look at `packages/adapter-svelte` in this repository:
it is the smallest of the hydrating adapters, with server loading in `load-component.ts` and the
client bundle in `build-client.ts`.

## Testing with the conformance suite

`@bgunnarsson/binbook-adapter-conformance` is a Vitest suite that checks an adapter meets the
contract: it has a name and a glob, `render` returns HTML containing an expected string, the output
is deterministic, and args change it.

```bash
pnpm add -D @bgunnarsson/binbook-adapter-conformance vitest
```

```ts
// mustache-adapter.test.ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { runAdapterConformance } from "@bgunnarsson/binbook-adapter-conformance";
import { mustache } from "./mustache-adapter";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

runAdapterConformance(mustache, {
  story: {
    id: "components-button",
    title: "Components/Button",
    component: "./button.mustache",
    args: {},
    variants: [],
    file: path.join(root, "button.binbook.json"),
  },
  root,
  args: { label: "Buy" },
  expectedHtmlIncludes: "Buy",
});
```

The fixture's component file must exist; the story file itself need not. The suite calls the
factory you pass for each test, so pass the function, not an instance.

# Configuration

binbook reads `binbook.config.ts` from the directory `binbook dev` runs in. The file default-exports
the result of `defineConfig`:

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import react from "@bgunnarsson/binbook-adapter-react";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [react()],
  port: 6006,
  background: "#ffffff",
  styles: ["./dist/app.css"],
  scripts: ["./dist/app.js"],
  decorators: ["./src/binbook/withTheme.tsx"],
});
```

The config is TypeScript and is loaded with [tsx](https://github.com/privatenumber/tsx), so it can
import from your project and read `process.env`. It works whether or not your `package.json` sets
`"type": "module"`.

## Options

| Option | Type | Default | |
| --- | --- | --- | --- |
| `stories` | `string[]` | — (required) | Globs that find story files |
| `adapters` | `Adapter[]` | — (required) | The adapter that renders your components |
| `port` | `number` | `6006` | Dev server port |
| `background` | `string` | `"#ffffff"` | Canvas backdrop |
| `styles` | `string[]` | `[]` | Stylesheets loaded into the canvas |
| `scripts` | `string[]` | `[]` | ES module scripts loaded into the canvas |
| `decorators` | `string[]` | `[]` | Decorators wrapped around every story |

### `stories`

Globs, matched with [fast-glob](https://github.com/mrmlnc/fast-glob) relative to the config file's
directory. Story files are JSON and conventionally end in `.binbook.json`.

```ts
stories: ["src/**/*.binbook.json", "packages/*/src/**/*.binbook.json"],
```

A file that is not valid JSON or does not match the [story format](stories.md) is skipped with a
warning in the terminal; the rest still load.

### `adapters`

The adapter instances that render stories. Each adapter's page lists its options.

```ts
adapters: [react({ hydrate: false })],
```

**Use one adapter per config.** binbook picks the first adapter whose `storyGlob` matches a story
file, and every built-in adapter claims `**/*.binbook.json`, so with several listed the first one
renders everything. Hot reload also watches files through the first adapter only. To preview
React and Vue components from one repository, give each its own config in its own directory
and run a binbook for each on a different `port`. See [Adapters](adapters/README.md#one-adapter-per-config).

### `port`

The port the dev server listens on. Reading it from the environment lets you run several
instances side by side:

```ts
port: process.env.BINBOOK_PORT ? Number(process.env.BINBOOK_PORT) : undefined,
```

`undefined` falls back to `6006`.

### `background`

The backdrop painted behind every story in the canvas: any CSS color. `"transparent"` shows a
checkerboard, which helps when checking a component's own edges and shadows.

```ts
background: "#0b0b0f",
```

### `styles`

Stylesheets injected as `<link rel="stylesheet">` into the canvas, so stories render with your
real CSS. Paths are relative to the project root.

```ts
styles: ["./src/styles/app.css", "./dist/components.css"],
```

They are served exactly as they are on disk, with no PostCSS, Sass or Tailwind step in between.
Point them at the CSS your build produces. If your stylesheet comes out of Tailwind, run your
Tailwind build (in watch mode while you work) and list its output file.

Only the listed files are reachable: each is served at `/__binbook_style/<index>.css`, keyed by its
position in the array. `url()` references inside the CSS resolve against that URL, so fonts and
images referenced by relative path will not load. Use absolute URLs, or inline them, for assets
the stories need.

The React, Vue and Svelte adapters drop `.css` imports inside components while server-rendering,
so `styles` is how imported CSS reaches the canvas for them too. A Vue or Svelte component's own
`<style>` block is different: those adapters render it into the canvas themselves.

### `scripts`

Built JavaScript injected into the canvas as `<script type="module">` after the story markup.
This is for progressive enhancement your site does on server-rendered HTML: carousels, accordions,
sliders and the like, especially for the HTML, Templates and Umbraco adapters, which ship no
client code of their own.

```ts
scripts: ["./wwwroot/dist/main.js"],
```

Each entry is a built ES module. binbook serves the entry's whole directory, so relative chunk
imports such as `./chunk-abc123.js` resolve. Requests that try to leave that directory are refused.
Point this at your build output, not at a dev server or a TypeScript source.

The script runs once when the canvas document loads. The canvas reloads its document whenever the
story or its args change, so your script sees fresh markup each time.

### `decorators`

Decorator modules wrapped around every story, outermost first. Paths are relative to the project
root and may name an export with `#`:

```ts
decorators: ["./src/binbook/withTheme.tsx", "./src/binbook/providers.tsx#WithI18n"],
```

A story's own `decorators` nest inside these. Supported by the React, Vue and Svelte adapters. See
[Decorators](decorators.md).

### `staticDirs`

Accepted by the type and defaulted to `[]`, but not used by the dev server in this version. Serve
static assets from your own site, or reference them by absolute URL.

## Environment variables

binbook reads no environment variables itself. Use `process.env` in the config for anything that
differs per machine: ports, endpoints, secrets.

```ts
umbraco({
  umbracoEndpoint: process.env.BINBOOK_UMBRACO_ENDPOINT,
  headers: { "X-Binbook-Secret": process.env.BINBOOK_UMBRACO_SECRET ?? "" },
}),
```

## Command line

```bash
binbook dev
```

`dev` is the only command and the default, so `binbook` on its own does the same. It loads the
config, discovers stories, starts the server and prints its URL. There is no static build: binbook
is a development tool and needs its dev server running to render stories.

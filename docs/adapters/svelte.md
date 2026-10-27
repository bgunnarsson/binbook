# Svelte adapter

Server-renders Svelte 5 components and hydrates them in the canvas.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-svelte
```

`svelte` 5 or newer must be installed in your project. Svelte 4 is not supported.

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import svelte from "@bgunnarsson/binbook-adapter-svelte";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [svelte()],
  styles: ["./dist/app.css"],
});
```

## Options

| Option | Default | |
| --- | --- | --- |
| `hydrate` | `true` | Ship a client bundle that hydrates each story. `false` renders static markup only |

## Components

`component` is a `.svelte` file relative to the story file. Args arrive as props through `$props()`:

```svelte
<!-- src/counter/Counter.svelte -->
<script>
  let { label = "Count", start = 0, step = 1 } = $props();
  let count = $state(start);
</script>

<div class="counter">
  <button onclick={() => (count -= step)} aria-label="decrement">−</button>
  <output>{label}: {count}</output>
  <button onclick={() => (count += step)} aria-label="increment">+</button>
</div>

<style>
  .counter { display: inline-flex; gap: 12px; align-items: center; }
</style>
```

```json
{
  "title": "Components/Counter",
  "component": "./Counter.svelte",
  "args": {
    "label": { "type": "text", "default": "Count" },
    "start": { "type": "number", "default": 0 },
    "step": { "type": "number", "default": 1 }
  },
  "stories": [{ "name": "Default", "args": {} }, { "name": "By tens", "args": { "step": 10 } }]
}
```

## Styles

Components are compiled with `css: "injected"`, so a component's `<style>` block renders with it
and needs no extra setup. Global CSS goes through [`styles`](../configuration.md#styles).

## Imports

The component is bundled with esbuild: relative imports and imported `.svelte` children work, and
bare imports resolve from `node_modules`. SvelteKit's `$lib` and `$app/*` aliases are not
available; use relative imports, and keep `$app/*` modules out of components you preview.

## Hydration

The adapter renders with `svelte/server`, including anything the component puts in
`<svelte:head>`, sends the args as `window.__BINBOOK_ARGS__`, and ships a bundle that hydrates the
markup.

## Decorators

Supported. A decorator renders its `children` snippet:

```svelte
<script>
  import { setContext } from "svelte";
  const { children } = $props();
  setContext("theme", "light");
</script>

{@render children()}
```

Svelte cannot compose components at run time, so the adapter generates a small wrapper component
that nests the decorators around the story and compiles that. See [Decorators](../decorators.md).

## Build cache

Compiled server modules and generated decorator wrappers go to `node_modules/.binbook-svelte/`, in
the `node_modules` nearest the component. Delete the folder whenever you like.

## Docs and watching

The Code tab and Docs view show the `.svelte` file. Saving it or the story file re-renders the
story.

## Example

`examples/svelte-sandbox`: a button, card, counter, and a greeting that reads context from the
`WithMessage` decorator.

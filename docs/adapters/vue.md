# Vue adapter

Server-renders Vue 3 single-file components and hydrates them in the canvas.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-vue
```

`vue` 3.3 or newer must be installed in your project.

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import vue from "@bgunnarsson/binbook-adapter-vue";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [vue()],
  styles: ["./dist/app.css"],
});
```

## Options

| Option | Default | |
| --- | --- | --- |
| `hydrate` | `true` | Ship a client bundle that hydrates each story. `false` renders static markup only |

## Components

`component` is a `.vue` file relative to the story file. `<script setup>`, a plain `<script>` and
template-only components all work, as does `lang="ts"`. Args are passed as props:

```vue
<!-- src/badge/Badge.vue -->
<script setup>
defineProps({ label: String, tone: { type: String, default: "neutral" } });
</script>

<template>
  <span :class="['badge', `badge--${tone}`]">{{ label }}</span>
</template>

<style scoped>
.badge { padding: 2px 8px; border-radius: 999px; }
.badge--danger { background: #fde2e1; color: #a61b1b; }
</style>
```

```json
{
  "title": "Components/Badge",
  "component": "./Badge.vue",
  "args": {
    "label": { "type": "text", "default": "New" },
    "tone": { "type": "select", "options": ["neutral", "danger"], "default": "neutral" }
  },
  "stories": [{ "name": "Default", "args": {} }, { "name": "Danger", "args": { "tone": "danger" } }]
}
```

An arg that is not a declared prop falls through to the root element as an attribute, as it would
in your app.

## Styles

The component's `<style>` blocks, scoped or not, are compiled and rendered into the canvas with
the story. Styles from decorators are included too. Global CSS goes through
[`styles`](../configuration.md#styles).

## Imports

The component is bundled with esbuild: relative imports and imported `.vue` children work, and bare
imports resolve from `node_modules`. Aliases from a Vite config (`@/…`) are not applied; use
relative imports.

## Hydration

The adapter renders with `vue/server-renderer`, sends the args as `window.__BINBOOK_ARGS__`, and
ships a bundle that calls `createSSRApp(...).mount()` on the markup. Mismatches between server and
client output show as hydration warnings in the browser console.

## Decorators

Supported. A decorator is an SFC with a default `<slot />`; use `provide` to supply context:

```vue
<script setup>
import { provide } from "vue";
provide("locale", "en");
</script>

<template>
  <slot />
</template>
```

There is no hook for `app.use()`, so plugins that need installing on the app (vue-router, Pinia,
vue-i18n) cannot be added the usual way. Where a component only injects something, provide a
stand-in from a decorator. See [Decorators](../decorators.md).

## Docs and watching

The Code tab and Docs view show the `.vue` file. Saving it or the story file re-renders the story.

## Example

`examples/vue-sandbox`: a button, card, stateful counter, and a greeting that reads context from the
`withMessage` decorator.

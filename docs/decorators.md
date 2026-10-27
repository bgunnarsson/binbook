# Decorators

Some components cannot render on their own because they read from a context a parent provides: a
`<Link>` needs a router, `useQuery` needs a `QueryClientProvider`, a translated label needs an i18n
provider. A **decorator** is a component that supplies that context and renders the story inside
it.

Decorators work with the **React**, **Vue** and **Svelte** adapters. A decorator is written in the
same framework as the stories it wraps.

## Writing one

A decorator renders its children. Pick the form for your framework.

**React**: a component that renders `children`.

```tsx
// src/decorators/withRouter.tsx
import type { ReactNode } from "react";
import { MemoryRouter } from "react-router-dom";

export default function withRouter({ children }: { children?: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}
```

**Vue**: a single-file component with a default `<slot />`.

```vue
<!-- src/decorators/WithI18n.vue -->
<script setup>
import { provide } from "vue";
provide("locale", "en");
</script>

<template>
  <slot />
</template>
```

**Svelte**: a Svelte 5 component that renders `children`.

```svelte
<!-- src/decorators/WithTheme.svelte -->
<script>
  import { setContext } from "svelte";
  const { children } = $props();
  setContext("theme", "light");
</script>

{@render children()}
```

## Using one

On one story, with a path relative to the story file:

```json
{
  "title": "Components/Nav",
  "component": "./Nav.tsx",
  "decorators": ["../decorators/withRouter.tsx"],
  "stories": [{ "name": "Default", "args": {} }]
}
```

On every story, in `binbook.config.ts`, with a path relative to the project root:

```ts
export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [react()],
  decorators: ["./src/decorators/withTheme.tsx"],
});
```

To use a named export instead of the default, add `#` and the export name:

```json
"decorators": ["../decorators/providers.tsx#WithStore"]
```

## Order

Config decorators wrap outermost, then the story's own, in the order listed. With
`decorators: ["./withTheme.tsx"]` in the config and `"decorators": ["./withRouter.tsx",
"./withStore.tsx"]` in a story, the tree is:

```
withTheme
  withRouter
    withStore
      <your component>
```

## Server rendering and hydration

The adapters render each story on the server and then hydrate it in the canvas, and decorators are
applied in both places, so the markup the server sends matches what the client hydrates. A
decorator therefore runs twice per render: once in Node and once in the browser. Keep it free of
work that only makes sense in one of them, or guard that work.

Create long-lived objects such as a `QueryClient` at module level, not inside the component, so a
re-render does not throw away their state:

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

const client = new QueryClient({ defaultOptions: { queries: { staleTime: Infinity, retry: false } } });

export default function withQueryClient({ children }: { children?: ReactNode }) {
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
```

## Meta-frameworks

Components from Remix, React Router, TanStack Start, Nuxt or SvelteKit are ordinary components that
expect their framework's providers. Supply those providers with a decorator and they render.

What a decorator cannot supply is server-only code: Remix `loader`s, TanStack Start
`createServerFn`, Nuxt server routes. Keep previewed components free of them and pass the data
they would load in as props, or mock it in a decorator.

## Ready-made examples

The sandboxes in this repository have working decorators:

- `examples/react-sandbox/src/decorators/`: `withRouter` (react-router) and `withQueryClient`
  (TanStack Query).
- `examples/vue-sandbox/src/decorators/withMessage.vue`: `provide`/`inject`.
- `examples/svelte-sandbox/src/decorators/WithMessage.svelte`: `setContext`/`getContext`.

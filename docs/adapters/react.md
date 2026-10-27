# React adapter

Server-renders React components and hydrates them in the canvas, so state, effects and event
handlers work.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-react
```

`react` and `react-dom` 18 or newer must be installed in your project; the adapter uses your copy.

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import react from "@bgunnarsson/binbook-adapter-react";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [react()],
  styles: ["./dist/app.css"],
});
```

## Options

| Option | Default | |
| --- | --- | --- |
| `hydrate` | `true` | Ship a client bundle that hydrates each story. `false` renders static markup only |

Turn hydration off for purely presentational components, or to check what a component renders
without JavaScript:

```ts
adapters: [react({ hydrate: false })],
```

## Components

`component` is a `.jsx`, `.tsx`, `.js` or `.ts` file relative to the story file. The default export
is rendered; name another export after `#`:

```json
{ "component": "./Button.tsx#PrimaryButton" }
```

Each arg is passed as a prop of the same name:

```tsx
// src/button/Button.tsx
export interface ButtonProps {
  label: string;
  variant?: "primary" | "secondary";
  disabled?: boolean;
}

export default function Button({ label, variant = "primary", disabled }: ButtonProps) {
  return (
    <button className={`btn btn--${variant}`} disabled={disabled}>
      {label}
    </button>
  );
}
```

```json
{
  "title": "Components/Button",
  "component": "./Button.tsx",
  "args": {
    "label": { "type": "text", "default": "Click me" },
    "variant": { "type": "select", "options": ["primary", "secondary"], "default": "primary" },
    "disabled": { "type": "boolean", "default": false }
  },
  "stories": [{ "name": "Default", "args": {} }]
}
```

Args are JSON, so props that take functions or React elements cannot be set from a story. Give
them defaults inside the component, or write a small wrapper component for the story that supplies
them.

JSX uses the automatic runtime; there is no need to import React in each file.

## Imports

The component is bundled with esbuild, so its relative imports work. Bare imports such as
`react-router-dom` resolve from your project's `node_modules`.

Imports of `.css`, `.scss`, `.svg`, `.png` and `.jpg` files are replaced with empty modules. A
`import "./button.css"` does nothing, and an `import logo from "./logo.svg"` gives `undefined`. Load
component CSS through [`styles`](../configuration.md#styles), and reference images by URL.

Import aliases defined in a Vite or webpack config (`@/components/...`) are not applied, and the
server render treats any non-relative import as a package. Use relative imports in components you
preview.

## Hydration

With `hydrate` on, the adapter renders the component with `renderToString`, sends the args along
as `window.__BINBOOK_ARGS__`, and ships a minified bundle that calls `hydrateRoot` on the markup.
Code that differs between server and browser (`window` checks, random ids, dates) causes the same
hydration warnings it would in your app; they show in the browser console.

The client bundle is built with `NODE_ENV=production`.

## Decorators

Supported. A decorator is a component that renders `children`:

```tsx
export default function withRouter({ children }: { children?: ReactNode }) {
  return <MemoryRouter>{children}</MemoryRouter>;
}
```

See [Decorators](../decorators.md).

## Build cache

Server bundles are written to `node_modules/.binbook-react/`, in the `node_modules` nearest the
component. They are named by content hash and never cleaned up automatically; delete the folder
whenever you like.

## Docs and watching

The Code tab and Docs view show the component file. Saving the component file or the story file
re-renders the story. Files the component imports are not watched; see
[Troubleshooting](../troubleshooting.md#an-edit-to-an-imported-file-does-not-show-up).

## Example

`examples/react-sandbox`: stateful counter, a router-dependent nav with the `withRouter` decorator,
and a TanStack Query component with `withQueryClient`.

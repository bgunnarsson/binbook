# Troubleshooting

## The canvas says "Render error"

The canvas shows only that line; the reason is in the server's response. Open the browser's
developer tools, go to the **Network** tab, select the story again, and look at the response of
the failed `render` request. It is JSON of the form `{ "error": "…" }`.

The usual causes:

| Error mentions | Cause |
| --- | --- |
| `ENOENT` and a path | `component` points at a file that does not exist. It is relative to the story file, not the project root |
| `export "…" … is not a component` | React: the default export, or the export named after `#`, is missing or is not a function |
| `couldn't determine the custom element tag` | Web Components: add `#tag-name` to `component`, or register the element with `customElements.define("tag-name", …)` |
| `no engine for ".…"` | Templates: no registered engine claims that file extension |
| `the "…" package is required` | Templates: install the engine package it names |
| `could not reach the Umbraco render endpoint` | Umbraco live: the site is not running, the URL is wrong, or its certificate is not trusted. See [Self-signed certificates](adapters/umbraco.md#self-signed-certificates) |
| `requires an auth header` | Umbraco live: the secret in `headers` does not match the site's `Binbook:Secret` |
| `razor host build failed` | Umbraco offline: `dotnet build` of the bundled host failed; the build output follows in the message |
| A syntax or compile error | The component itself does not compile |

## A story is missing from the sidebar

- Check the terminal. A story file that is not valid JSON or does not match the format is skipped
  with `[binbook] skipping invalid story <file>: <reason>`.
- Check that the file matches a glob in [`stories`](configuration.md#stories). Globs are relative
  to the config file.
- Refresh the browser. The sidebar loads once and does not update on hot reload.
- Two stories with titles that produce the same id collide. Make titles unique.

## The component renders without styles

The canvas is a separate document and loads only the stylesheets listed in
[`styles`](configuration.md#styles). CSS imported from inside a React or web component module is
dropped. List your built CSS file in `styles`.

If the file is listed but styles still do not apply, check that it is built CSS. It is served as-is,
so Sass, PostCSS syntax or Tailwind directives reach the browser unprocessed.

Fonts and images referenced from the CSS by relative path do not load, because the stylesheet is
served from a binbook URL. Use absolute URLs for them.

## A config option has no effect

Restart `binbook dev`. The config is read once at startup.

## Every story renders with the wrong adapter

binbook gives each story to the first adapter in `adapters`, because the built-in adapters all
match every story file. Use one adapter per config. See
[Adapters › One adapter per config](adapters/README.md#one-adapter-per-config).

## An edit does not show up

- Edits to the open story's component and story file re-render it. Edits to files the component
  imports, partials it includes, or a story you are not looking at, do not. Select the story again,
  or save its component file.
- After adding a story or changing args or variants, refresh the browser.
- Umbraco live views live in the site: re-render by refreshing the browser.

## An edit to an imported file does not show up

React, Vue and Svelte cache each story's client bundle until the component file or a decorator
changes. If you edit a child component and the server markup updates but the interactive version
does not, or the console reports a hydration mismatch, save the story's own component file to
rebuild the bundle.

## Hydration warnings in the console

The server markup and the first client render differ. The causes are the same as in your app:
reading `window`, `Date.now()` or `Math.random()` during render, or args the component treats
differently on each side. Check by turning hydration off with `hydrate: false`: if the story looks
right then, the problem is on the client side.

## A component that needs a provider throws

`useNavigate() may be used only in the context of a <Router>`, `No QueryClient set`, a missing
`inject()` value: the component needs context. Wrap it in a [decorator](decorators.md).

## The port is in use

Another process, or another binbook, is on port 6006. Set [`port`](configuration.md#port) in the
config.

## The Umbraco host is slow to start

The first offline render runs `dotnet build` on the bundled host, restoring NuGet packages. Later
starts reuse the build. If the build is corrupt, delete
`node_modules/@bgunnarsson/binbook-adapter-umbraco/host/bin` and `…/host/obj` to force a rebuild.

## Requests to `/api/*` get 403

The dev server only answers requests whose `Host` is `localhost`, a `*.localhost` name or an IP
address, and refuses browser requests from other origins. This blocks DNS-rebinding attacks on the
API, which runs your project's code. Open the viewer through `localhost` or an IP, not a custom
hostname.

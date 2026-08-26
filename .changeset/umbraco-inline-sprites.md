---
"@bgunnarsson/binbook-adapter-umbraco": minor
---

Inline external SVG sprite symbols in `umbraco` mode. Live-site markup references
its icon sprite by URL (`<use href="/build-…/icons.svg#id">`), which the browser
refuses to load cross-origin into the sandboxed, opaque-origin canvas — so sprite
icons silently vanished even though a `<base href>` resolves `<img>`/`<link>`.
The adapter now fetches the sprite server-side, inlines the referenced `<symbol>`s
into the document, and rewrites each `<use>` to a same-document fragment, so icons
render in the canvas. Best-effort and cached: unresolvable refs are left untouched.

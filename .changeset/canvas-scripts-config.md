---
"@bgunnarsson/binbook-types": minor
"@bgunnarsson/binbook-core": minor
"@bgunnarsson/binbook-viewer": minor
---

Add a `scripts` config option — the JS counterpart to `styles`. Listed built ESM
entries are injected into the canvas iframe as `<script type="module">` after the
markup, so stories run the real app's client JS (progressive enhancement like
carousels/sliders that hydrate server-rendered markup — e.g. Umbraco `live`-mode
blocks).

```ts
defineConfig({
  styles: ["wwwroot/build/main.min.css"],
  scripts: ["wwwroot/build/main.js"], // built entry, not a dev server
})
```

Each entry's whole directory is served under `/__binbook_script/<i>/` (confined to
that directory), so the entry's relative chunk imports (`./chunk-abc.js`) resolve
to siblings. The route sends `Access-Control-Allow-Origin: *` so the modules load
into the sandboxed, opaque-origin canvas — an otherwise-blocked cross-origin
module fetch. Point `scripts` at build output (the files your site ships), not a
dev server, so hashed chunk imports resolve.

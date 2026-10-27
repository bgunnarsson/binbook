# @bgunnarsson/binbook-core

## 2.0.1

### Patch Changes

- Licensechange
- Updated dependencies
  - @bgunnarsson/binbook-types@2.0.1
  - @bgunnarsson/binbook-viewer@2.0.1

## 2.0.0

### Major Changes

- 6b4ecfb: binbook is now under the binbook Source-Available License (BSAL) v1.1 instead of Apache-2.0. Each
  package ships the licence as LICENSE in place of NOTICE.

### Minor Changes

- 520abc7: The viewer tells you when a newer binbook is on npm. The dev server checks the registry once per
  start, and the sidebar shows a card with the upgrade command for your package manager; dismissing it hides
  it until the next reload.

### Patch Changes

- Updated dependencies [6b4ecfb]
- Updated dependencies [520abc7]
  - @bgunnarsson/binbook-viewer@2.0.0
  - @bgunnarsson/binbook-types@2.0.0

## 1.0.1

### Patch Changes

- Documentation moved to docs/ in the repository; the Umbraco adapter's README points there.
- Updated dependencies
  - @bgunnarsson/binbook-viewer@1.0.1
  - @bgunnarsson/binbook-types@1.0.1

## 1.0.0

### Major Changes

- binbook 1.0.0: the config, story format and adapter interface are stable.

### Minor Changes

- 9c40045: Add a `scripts` config option — the JS counterpart to `styles`. Listed built ESM entries are
  injected into the canvas iframe as `<script type="module">` after the markup, so stories run the real app's
  client JS (progressive enhancement like carousels/sliders that hydrate server-rendered markup — e.g. Umbraco
  `live`-mode blocks).

  ```ts
  defineConfig({
    styles: ["wwwroot/build/main.min.css"],
    scripts: ["wwwroot/build/main.js"], // built entry, not a dev server
  });
  ```

  Each entry's whole directory is served under `/__binbook_script/<i>/` (confined to that directory), so the
  entry's relative chunk imports (`./chunk-abc.js`) resolve to siblings. The route sends
  `Access-Control-Allow-Origin: *` so the modules load into the sandboxed, opaque-origin canvas — an
  otherwise-blocked cross-origin module fetch. Point `scripts` at build output (the files your site ships),
  not a dev server, so hashed chunk imports resolve.

- c6e1b64: The packages work when installed from a registry. The Umbraco adapter's tarball now carries the
  Razor host (`host/`) it builds on first use, and every tarball carries the `NOTICE` that Apache-2.0 asks
  for.

  The dev server's `/api/*` routes refuse cross-origin requests (403), the wrong method (405) and non-JSON
  POSTs (415), so another page can no longer drive them with a `text/plain` POST.

- 9c40045: Rename the Razor adapter to the Umbraco adapter to match its focus.

  - Package `@bgunnarsson/binbook-adapter-razor` → `@bgunnarsson/binbook-adapter-umbraco` (directory
    `packages/adapter-razor` → `packages/adapter-umbraco`). The default export is now `umbraco()` (was
    `razor()`), and the adapter's `name` is `"umbraco"`.
  - **Breaking (story format):** the per-story config key `"razor": { … }` is now `"umbraco": { … }`. The
    exported types rename accordingly: `RazorStoryOptions` → `UmbracoStoryOptions`, `RazorContentRef` →
    `UmbracoContentRef`, `RazorBlockRef` → `UmbracoBlockRef`, `RazorBlockListRef` → `UmbracoBlockListRef`.
  - **Breaking (mode values):** the `mode` values are renamed to describe where the partial renders — `"mvc"`
    → `"offline"` (embedded Razor host) and `"umbraco"` → `"live"` (running site's render endpoint). `offline`
    remains the default, so plain-Razor stories that set no `umbraco` block are unaffected. This removes the
    redundant `"umbraco": { "mode": "umbraco" }`.

  The offline Razor-host capability is unchanged — only its name moved. The `RazorHost` .NET project keeps its
  name, since it genuinely hosts the ASP.NET Core Razor engine.

  Migration: rename the package in `package.json`, change the import/default call from `razor(...)` to
  `umbraco(...)`, rename the `"razor"` key to `"umbraco"`, and change `"mode": "umbraco"` → `"mode": "live"`
  (or `"mvc"` → `"offline"`) in every `.binbook.json` that sets it.

- 9c40045: Render Umbraco Block List blocks in `umbraco` mode. A block view is typed as `BlockListItem`, not
  `IPublishedContent`, so it can't render against a node directly — it needs a real authored block. A single
  _manifest_ story (`umbraco.blockList` pointing at a "showcase" node whose block list holds one of every
  block type) now expands — at discovery — into one story per block type plus a full-page story rendering the
  whole list.

  Adds an optional `Adapter.expand(story)` hook (a new `expandStories` step in core runs it after discovery,
  isolating failures so an unreachable site drops only its manifest), the
  `UmbracoBlockRef`/`UmbracoBlockListRef` contracts and `block`/ `blockList` story options, and two endpoint
  shapes on the render controller: `list` (enumerate a node's block list) and `block` (render one block by
  content-type alias, or the whole list). Blocks are addressed by alias so the showcase can be reordered
  freely.

  The block-view folder varies per project, so it's a configurable `viewPath` template on the story (`{alias}`
  verbatim / `{Alias}` PascalCase), defaulting to Umbraco's
  `~/Views/Partials/blocklist/Components/{alias}.cshtml`. It's resolved per block and sent to the endpoint, so
  no controller edits are needed to point at a project's own folder.

### Patch Changes

- Updated dependencies [9c40045]
- Updated dependencies
- Updated dependencies [c6e1b64]
- Updated dependencies [9c40045]
- Updated dependencies [9c40045]
- Updated dependencies [9c40045]
- Updated dependencies [9c40045]
- Updated dependencies [2cbbba2]
  - @bgunnarsson/binbook-types@1.0.0
  - @bgunnarsson/binbook-viewer@1.0.0

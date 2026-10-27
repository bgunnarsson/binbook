# @bgunnarsson/binbook-viewer

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
  - @bgunnarsson/binbook-types@2.0.0

## 1.0.1

### Patch Changes

- Documentation moved to docs/ in the repository; the Umbraco adapter's README points there.
- Updated dependencies
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

- 9c40045: Deep-link viewer state to the URL. The selected story, variant, live args, and viewport now
  round-trip through the query string (`?story=…&v=…&vp=…&args=…`), so links are shareable and survive a
  refresh. Selecting a different story pushes a history entry (browser Back/Forward walks between stories)
  while tweaking args or the viewport replaces the current entry, keeping the history stack clean.
- 9c40045: Add a dock toggle to the work panel. A button on the right of the panel's tab bar flips it between
  docking below the canvas and beside it (right). The resize handle follows the active edge (height when
  bottom, width when right), each dock remembers its own size, and the choice persists across reloads.
- 2cbbba2: The viewer has themes. A select at the foot of the sidebar picks one: Default follows the OS with
  Cloud (cool white, slate text, indigo accent) in light and Geist (near-black, `#ededed` text, a white
  primary) in dark, and the rest are dark palettes after well-known design systems and editor themes:
  Material, Catppuccin Mocha, Carbon, Primer, Radix, Atlassian, Apple, Polaris, Linear, Tokyo Night, Rosé
  Pine, Dracula, Gruvbox and One Dark. The choice is remembered, and other open viewer tabs follow it.
  Alongside it the chrome is restyled: Poppins for the UI with JetBrains Mono kept for code, borderless
  inputs, segmented controls for Canvas/Docs and the viewport sizes, a soft highlight for the selected story,
  and count pills on the panel tabs.

  The canvas iframe now shows a project's configured `background` in dark themes too; before, the browser
  painted a white backdrop over it.

### Patch Changes

- c6e1b64: The packages work when installed from a registry. The Umbraco adapter's tarball now carries the
  Razor host (`host/`) it builds on first use, and every tarball carries the `NOTICE` that Apache-2.0 asks
  for.

  The dev server's `/api/*` routes refuse cross-origin requests (403), the wrong method (405) and non-JSON
  POSTs (415), so another page can no longer drive them with a `text/plain` POST.

- Updated dependencies [9c40045]
- Updated dependencies
- Updated dependencies [c6e1b64]
- Updated dependencies [9c40045]
- Updated dependencies [9c40045]
  - @bgunnarsson/binbook-types@1.0.0

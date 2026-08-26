---
"@bgunnarsson/binbook-adapter-umbraco": minor
"@bgunnarsson/binbook-types": minor
"@bgunnarsson/binbook-core": minor
---

Rename the Razor adapter to the Umbraco adapter to match its focus.

- Package `@bgunnarsson/binbook-adapter-razor` → `@bgunnarsson/binbook-adapter-umbraco` (directory `packages/adapter-razor` → `packages/adapter-umbraco`). The default export is now `umbraco()` (was `razor()`), and the adapter's `name` is `"umbraco"`.
- **Breaking (story format):** the per-story config key `"razor": { … }` is now `"umbraco": { … }`. The exported types rename accordingly: `RazorStoryOptions` → `UmbracoStoryOptions`, `RazorContentRef` → `UmbracoContentRef`, `RazorBlockRef` → `UmbracoBlockRef`, `RazorBlockListRef` → `UmbracoBlockListRef`.
- **Breaking (mode values):** the `mode` values are renamed to describe where the partial renders — `"mvc"` → `"offline"` (embedded Razor host) and `"umbraco"` → `"live"` (running site's render endpoint). `offline` remains the default, so plain-Razor stories that set no `umbraco` block are unaffected. This removes the redundant `"umbraco": { "mode": "umbraco" }`.

The offline Razor-host capability is unchanged — only its name moved. The `RazorHost` .NET project keeps its name, since it genuinely hosts the ASP.NET Core Razor engine.

Migration: rename the package in `package.json`, change the import/default call from `razor(...)` to `umbraco(...)`, rename the `"razor"` key to `"umbraco"`, and change `"mode": "umbraco"` → `"mode": "live"` (or `"mvc"` → `"offline"`) in every `.binbook.json` that sets it.

---
"@bgunnarsson/binbook-adapter-umbraco": minor
"@bgunnarsson/binbook-core": minor
"@bgunnarsson/binbook-types": minor
---

Render Umbraco Block List blocks in `umbraco` mode. A block view is typed as
`BlockListItem`, not `IPublishedContent`, so it can't render against a node
directly — it needs a real authored block. A single *manifest* story
(`umbraco.blockList` pointing at a "showcase" node whose block list holds one of
every block type) now expands — at discovery — into one story per block type plus
a full-page story rendering the whole list.

Adds an optional `Adapter.expand(story)` hook (a new `expandStories` step in core
runs it after discovery, isolating failures so an unreachable site drops only its
manifest), the `UmbracoBlockRef`/`UmbracoBlockListRef` contracts and `block`/
`blockList` story options, and two endpoint shapes on the render controller:
`list` (enumerate a node's block list) and `block` (render one block by
content-type alias, or the whole list). Blocks are addressed by alias so the
showcase can be reordered freely.

The block-view folder varies per project, so it's a configurable `viewPath`
template on the story (`{alias}` verbatim / `{Alias}` PascalCase), defaulting to
Umbraco's `~/Views/Partials/blocklist/Components/{alias}.cshtml`. It's resolved
per block and sent to the endpoint, so no controller edits are needed to point at
a project's own folder.

---
"@bgunnarsson/binbook-core": minor
"@bgunnarsson/binbook-types": minor
"@bgunnarsson/binbook-adapter-umbraco": patch
"@bgunnarsson/binbook-adapter-html": patch
"@bgunnarsson/binbook-adapter-react": patch
"@bgunnarsson/binbook-adapter-svelte": patch
"@bgunnarsson/binbook-adapter-templates": patch
"@bgunnarsson/binbook-adapter-vue": patch
"@bgunnarsson/binbook-adapter-web-components": patch
"@bgunnarsson/binbook-adapter-conformance": patch
"@bgunnarsson/binbook-viewer": patch
---

The packages work when installed from a registry. The Umbraco adapter's tarball
now carries the Razor host (`host/`) it builds on first use, and every tarball
carries the `NOTICE` that Apache-2.0 asks for.

The dev server's `/api/*` routes refuse cross-origin requests (403), the wrong
method (405) and non-JSON POSTs (415), so another page can no longer send a
`text/plain` POST to `/api/chat` and spend `ANTHROPIC_API_KEY`.

The assistant's model is configurable with `chat: { model }` in the binbook
config, and defaults to `claude-opus-5-5`.

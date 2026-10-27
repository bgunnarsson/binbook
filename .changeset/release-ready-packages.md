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
method (405) and non-JSON POSTs (415), so another page can no longer drive them
with a `text/plain` POST.

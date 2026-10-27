# @bgunnarsson/binbook-adapter-templates

## 2.0.0

### Major Changes

- 6b4ecfb: binbook is now under the binbook Source-Available License (BSAL) v1.1 instead of Apache-2.0. Each
  package ships the licence as LICENSE in place of NOTICE.

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

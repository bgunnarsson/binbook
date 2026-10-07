---
title: Vite plugin middlewares run before Vite's Host check, so an Origin-equals-Host guard is open to DNS rebinding
date: 2026-10-07
category: security
module: packages/core
paths:
  - packages/core/src/server.ts
  - packages/core/bin/**
tags: [vite, dns-rebinding, csrf, middleware, allowedHosts]
symptoms:
  - "Origin: http://evil.example:6006 and Host: evil.example:6006 pass rejectApiRequest"
  - a cross-site page can POST application/json to /api/chat and read the reply once its name resolves to 127.0.0.1
  - Vite's allowedHosts never refuses a request to a binbook /api/* route
root_cause: binbookServer registers /api/* with server.middlewares.use inside configureServer, which Vite runs before it adds hostCheckMiddleware, and the guard compared Origin to Host, both of which a rebound page chooses.
related: []
---

## Problem

The `/api/*` routes needed protection from cross-site requests, because
`/api/chat` spends `ANTHROPIC_API_KEY`. The first guard returned 403 when the
`Origin` host differed from the `Host` header. Security review showed that DNS
rebinding gets past it.

## What didn't work

- **Origin must equal Host.** A page on `evil.example:6006` whose DNS rebinds to
  127.0.0.1 sends `Origin: http://evil.example:6006` and
  `Host: evil.example:6006`. The browser treats it as same-origin, so there is
  no preflight, and the guard passes.
- **Relying on Vite's `allowedHosts`.** Vite 5.4.21 has a `hostCheckMiddleware`
  that refuses non-local hosts by default, but it never sees these requests (see
  Root cause).
- **Checking Host only when Origin is present.** Browsers omit `Origin` on
  same-origin GETs, so a rebound page could still read `/api/stories` and
  `/api/config`.

## Root cause

In `vite/dist/node/chunks/dep-BK3b2jBa.js` (5.4.21), `_createServer` awaits every
plugin's `configureServer` hook (around line 63336) before it adds
`hostCheckMiddleware` (around line 63353). Middleware added with
`server.middlewares.use(...)` directly inside `configureServer`, rather than in
the post hook the function returns, therefore answers before Vite's Host check
runs. The ordering and the default were verified in the installed Vite source.
The rebinding attack itself was reasoned from that, not reproduced in a browser.

## Fix

Commit 0712680, `packages/core/src/server.ts`: `rejectApiRequest` now refuses
any request whose `Host` is not `localhost`, `*.localhost` or an IP literal.
That mirrors Vite's default `allowedHosts`. The guard still also requires the
`Origin`, when present, to match the `Host`. Cases are in
`packages/core/src/server.test.ts`. A live check against `pnpm html`: a JSON POST
to `/api/render` with `Host: evil.test:6006` returns 403, and the same request
with `Host: localhost:6006` returns 200.

## Prevention

- Any middleware binbook registers with `server.middlewares.use` inside
  `configureServer` must do its own Host validation. Do not assume Vite's
  `allowedHosts`, CORS or `rejectInvalidRequestMiddleware` has run. Moving it
  into the returned post hook would put it after the Host check, but also after
  Vite's transform and SPA middlewares.
- A guard that compares two request headers to each other (`Origin` vs `Host`)
  without checking one of them against a fixed allowlist is a violation.
- In a diff, look out for removing the `isLocalHost` check from
  `rejectApiRequest`, or adding an `/api/*` route that bypasses `guard(...)`.

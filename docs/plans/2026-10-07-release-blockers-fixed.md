---
title: The packages install and run from a registry, and CI gates every push
date: 2026-10-07
status: in-progress
---

## Context

A release-readiness review on 2026-10-07 found the workspace green (typecheck,
180 unit tests, 19 e2e) but the published artifacts not: packing the packages
and installing them into a clean project showed problems the workspace never
sees. The user asked for every finding to be fixed.

Findings, and the decision taken for each (made on the user's behalf unless
noted):

1. **Umbraco host not published.** `packages/adapter-umbraco/package.json`
   `files` is `["src", …]`, so `host/` (`RazorHost.csproj`, `Program.cs`,
   `NuGet.config`) is missing from the tarball and `host-client.ts:7`
   (`HOST_DIR = ../host`) fails for every installed user. Add `host` with
   `!host/bin` and `!host/obj` negations (npm ignores the nested `.gitignore`
   once `files` is set). `buildHost()` keeps building in place on first use;
   moving the build output out of `node_modules` is out of scope.
2. **No CI.** Add `.github/workflows/ci.yml`: install, typecheck, lint, unit,
   e2e, and a pack-and-install smoke test. Root `package.json` gets
   `"packageManager": "pnpm@11.25.0"` so `pnpm/action-setup` needs no version;
   Node comes from `.nvmrc`; dotnet `8.0.x` (host TFM `net8.0`) so the Umbraco
   unit tests stop skipping and its e2e spec can run. `pnpm release` gains
   `pnpm lint` between typecheck and test.
3. **Cross-site requests to the JSON API.** `readJson` (`server.ts:69`) and the
   `/api/*` routes accept any method and content type, so any page can send a
   no-preflight `text/plain` POST to `/api/chat` and spend
   `ANTHROPIC_API_KEY`. Add one guard used by every `/api/*` route: 403 when an
   `Origin` header is present and its host differs from the `Host` header; 405
   on the wrong method (GET for `stories`/`config`, POST for
   `render`/`docs`/`chat`); 415 when a POST is not `application/json`. The
   viewer already sends exactly that (`packages/viewer/src/api.ts:19-62`).
   Requests with no `Origin` (curl, scripts) stay allowed: they are not a
   browser attack. `/__binbook_script/` keeps its `access-control-allow-origin: *`.
4. **Lint red.** Biome lints the gitignored `.binai/`; enable
   `vcs: { enabled: true, clientKind: "git", useIgnoreFile: true }`. The
   `.svelte`/`.vue` warnings are false positives (Biome sees only `<script>`,
   not template usages), so an `overrides` entry for `**/*.svelte`,
   `**/*.vue` turns off `noUnusedVariables`, `noUnusedImports` and `useConst`.
   The remaining warnings (`noNonNullAssertion`, `useTemplate`,
   `noTemplateCurlyInString`) are fixed in source; where a test string
   deliberately contains `${`, a `biome-ignore` with the reason.
5. **README** still sends readers to the monorepo instead of a registry install.
   The Quickstart leads with `pnpm add -D`; working inside the monorepo moves to
   a short "Developing binbook" note.
6. **NOTICE** is in no tarball (pnpm copies the root LICENSE but not NOTICE).
   Each publishable package gets `"prepack": "cp ../../NOTICE NOTICE"` and
   `"postpack": "rm NOTICE"`, and `packages/*/NOTICE` is gitignored. If
   `pnpm pack` turns out not to run those hooks, fall back to committed
   per-package copies and say so.
7. **Hardcoded chat model** `claude-opus-4-8` (`chat.ts:20`). `BinbookConfig`
   gains `chat?: { model?: string }`; `runChat(body, model)` defaults to the
   current Opus model, `claude-opus-5-5`, and `server.ts` passes
   `opts.config.chat?.model`.
8. **Changesets config** ignores 3 of the 7 private sandboxes and its README
   says "three". List all seven; reword the README.

Published packages change (umbraco `files`, core guard and chat model, types
field, NOTICE in all), so one changeset records them.

## Relevant lore

None found.

## Acceptance criteria

- `tar tzf` of the packed umbraco tarball lists `package/host/RazorHost.csproj`,
  `package/host/Program.cs`, `package/host/NuGet.config`, and nothing under
  `host/bin` or `host/obj`.
- Every packed publishable tarball lists `package/NOTICE`; `git status` is
  clean after packing.
- `curl -X POST -H 'content-type: text/plain' -H 'Origin: http://evil.test'
  localhost:6006/api/chat` returns 403; a POST to `/api/render` with
  `content-type: text/plain` and no Origin returns 415; `GET /api/render`
  returns 405; the viewer still renders stories (e2e green).
- `runChat` sends the configured `chat.model` when set, and the default model
  otherwise (unit test with a mocked SDK).
- `pnpm lint` exits 0 with no warnings.
- `.github/workflows/ci.yml` runs typecheck, lint, test, e2e and the smoke
  test; `pnpm release` runs lint.
- The smoke script packs, installs the tarballs into a temp project outside the
  workspace, starts `binbook dev`, and gets the expected HTML from
  `/api/render`; it exits non-zero on any failure.
- README Quickstart starts with a registry install; `.changeset/config.json`
  ignores all seven sandboxes.

## Tasks

- [x] Biome: add the `vcs` block and the svelte/vue override in `biome.json`; fix
  the remaining warnings in source. Verify: `pnpm lint --max-diagnostics=200`
  exits 0 with no warnings; `pnpm test` still green.
- [ ] Ship the Umbraco host: add `host`, `!host/bin`, `!host/obj` to
  `packages/adapter-umbraco/package.json` `files`. Verify: `pnpm pack` in the
  package and `tar tzf` matches the criterion.
- [ ] NOTICE in every tarball: `prepack`/`postpack` in each publishable
  package, `packages/*/NOTICE` in `.gitignore`. Verify: pack each, `tar tzf |
  grep NOTICE`, `git status` clean.
- [ ] API guard in `packages/core/src/server.ts`: one exported
  `rejectApiRequest(req, method)` returning the status code or `undefined`,
  called first in each `/api/*` route. Verify: new cases in
  `packages/core/src/server.test.ts` for 403 cross-origin, 405 wrong method,
  415 non-JSON POST, and allowed same-origin and no-Origin requests; `pnpm
  test:e2e` green.
- [ ] Chat model from config: `chat?: { model?: string }` on `BinbookConfig`
  (`packages/types/src/index.ts:208`), `runChat(body, model?)` in
  `packages/core/src/chat.ts`, passed from `server.ts`. Verify: new cases in
  `packages/core/src/chat.test.ts` with `vi.mock('@anthropic-ai/sdk')`
  asserting the model sent; `pnpm typecheck`.
- [ ] Smoke test: `scripts/smoke-pack.mjs` packs every publishable package with
  `pnpm pack`, installs them into a temp project with the README's HTML
  example, runs `binbook dev` on a free port, POSTs `/api/render`, asserts the
  markup, asserts the umbraco tarball contains the host and every tarball
  contains NOTICE, then cleans up. Root script `pnpm smoke`. Verify: `pnpm
  smoke` exits 0; breaking the umbraco `files` locally makes it exit non-zero.
- [ ] CI: `.github/workflows/ci.yml` on push and pull_request; `packageManager`
  in root `package.json`; `pnpm release` runs lint. Verify: `actionlint` (via
  `npx --yes` or brew) reports nothing; each step's command runs locally.
- [ ] Docs and config: README Quickstart, `.changeset/config.json` ignore list,
  `.changeset/README.md` wording, and one changeset for the published changes.
  Verify: read the rendered README section; `pnpm changeset status`.

## Files

- `biome.json`: `vcs` block, `overrides` for `**/*.svelte`, `**/*.vue`.
- `packages/adapter-umbraco/package.json`: `files`.
- `packages/*/package.json` (11 publishable): `prepack`/`postpack`.
- `.gitignore`: `packages/*/NOTICE`.
- `packages/core/src/server.ts`: new guard beside `readJson` (line 69); called
  in the `/api/*` routes (lines 171-216), reusing their `res.statusCode` +
  `{ error }` JSON shape.
- `packages/core/src/server.test.ts`: guard cases.
- `packages/core/src/chat.ts`, `chat.test.ts` (reuse its env save/restore).
- `packages/types/src/index.ts`: `BinbookConfig.chat`.
- `scripts/smoke-pack.mjs` (new), root `package.json` (`smoke`,
  `packageManager`, `release`).
- `.github/workflows/ci.yml` (new).
- `README.md:10-26`, `.changeset/config.json`, `.changeset/README.md`, new
  `.changeset/*.md`.

## Verification

1. `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e` all exit 0, lint
   with zero warnings.
2. `pnpm smoke` exits 0: clean-project install renders the HTML story, umbraco
   tarball carries the host, every tarball carries NOTICE.
3. Start `pnpm html`, then with curl: cross-origin `text/plain` POST to
   `/api/chat` → 403; `text/plain` POST to `/api/render` → 415; `GET
   /api/render` → 405; JSON POST to `/api/render` with no Origin → 200.
4. Open the viewer in a browser: stories render, controls update the canvas.
5. `git status` clean after packing.

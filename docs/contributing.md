# Contributing

How to work on binbook itself. To use binbook in a project, start at
[Getting started](getting-started.md) instead.

## Setup

You need Node 20+ (the version in `.nvmrc`), pnpm (the version in `package.json`'s
`packageManager`; Corepack will pick it up), and, for the Umbraco adapter, the .NET 8 SDK.

```bash
pnpm install
```

## Layout

```
packages/
  core/                 config, discovery, dev server, CLI
  viewer/               the browser UI
  types/                shared contracts
  adapter-*/            one package per adapter
  adapter-conformance/  the shared adapter test suite
examples/               one sandbox project per adapter
e2e/                    Playwright tests across the sandboxes
scripts/smoke-pack.mjs  packs every package and tests the tarballs
docs/                   these docs, and docs/solutions for lessons learned
```

[Architecture](architecture.md) explains how the pieces fit.

## Running a sandbox

Each sandbox under `examples/` links the workspace packages, so edits show up without a build.

```bash
pnpm html        # examples/html-sandbox
pnpm react       # examples/react-sandbox
pnpm vue         # examples/vue-sandbox
pnpm svelte      # examples/svelte-sandbox
pnpm wc          # examples/wc-sandbox
pnpm templates   # examples/templates-sandbox
pnpm umbraco     # examples/umbraco-sandbox (needs dotnet)
```

Each starts on port 6006 unless `BINBOOK_PORT` is set.

## Checks

```bash
pnpm test        # Vitest: unit and integration tests
pnpm typecheck   # tsc --noEmit for every package
pnpm lint        # Biome
pnpm test:e2e    # Playwright across every sandbox; starts its own servers
pnpm smoke       # packs every package, installs the tarballs in a clean project, renders a story
```

`test:e2e` needs Chromium once: `pnpm exec playwright install chromium`. It boots one dev server per
sandbox on the ports in `e2e/ports.ts`, so nothing else needs to be running. Without `dotnet`, the
Umbraco unit tests skip and its sandbox cannot start.

CI (`.github/workflows/ci.yml`) runs all five on every push and pull request.

Two Biome settings are deliberate. `noUnknownAtRules` is off because the viewer's stylesheet uses
Tailwind's `@tailwind` and `@apply`. `examples/html-sandbox/src` and `**/test/fixtures` are excluded
because they hold Mustache-style templates Biome cannot parse as HTML.

## Changes and releases

Releases use [Changesets](https://github.com/changesets/changesets). With a change that affects a
published package, add a changeset describing it:

```bash
pnpm changeset
```

To release, `pnpm version-packages` applies pending changesets to versions and changelogs, and
`pnpm release` runs the type check, lint and tests, then publishes to npm. The example sandboxes
are never published.

## Docs

User docs live in `docs/`, one page per topic, and the root `README.md` links to them. When a
change alters behaviour a page describes, update the page in the same change.

`docs/solutions/` holds write-ups of problems that took real digging, with the rule each one
leaves behind. Read the relevant ones before changing the code they cover.

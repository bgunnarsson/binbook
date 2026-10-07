# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

- Run `pnpm changeset` to record a change: pick the affected packages and a bump
  (patch / minor / major) and write a short summary. This creates a markdown file
  here that you commit alongside your code.
- Run `pnpm version-packages` to consume the pending changesets, bump versions,
  and update changelogs.
- Run `pnpm release` to run the gates (typecheck, lint, tests) and publish the bumped
  packages to npm.

The `examples/*` sandboxes are private, and every one is listed in `ignore` in
`config.json`; add a new sandbox there too.

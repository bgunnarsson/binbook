# Changesets

This folder is managed by [changesets](https://github.com/changesets/changesets).

- Run `pnpm changeset` to record a change: pick the affected packages and a bump
  (patch / minor / major) and write a short summary. This creates a markdown file
  here that you commit alongside your code.
- Run `pnpm version-packages` to consume the pending changesets, bump versions,
  and update changelogs.
- Run `pnpm release` to run the gates (typecheck + tests) and publish the bumped
  packages to npm.

The three `examples/*` sandboxes are private and ignored by changesets.

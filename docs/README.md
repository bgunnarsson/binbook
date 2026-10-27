# binbook docs

Start with [Getting started](getting-started.md) if you have never run binbook. The rest is
reference: read the page for the thing you are doing.

## Using binbook

| Page | What it covers |
| --- | --- |
| [Getting started](getting-started.md) | Install, a first component and story, running the dev server |
| [Configuration](configuration.md) | Every option in `binbook.config.ts`: stories, adapters, port, canvas background, project styles and scripts, global decorators |
| [Writing stories](stories.md) | The `*.binbook.json` format: title, component, args and their controls, variants, the preview wrapper |
| [Decorators](decorators.md) | Wrapping stories in providers (router, store, theme, i18n) for React, Vue and Svelte |
| [The viewer](viewer.md) | The browser UI: sidebar, canvas, viewports, controls, actions, accessibility checks, docs, themes, shareable URLs |
| [Troubleshooting](troubleshooting.md) | Common errors and what causes them |

## Adapters

An adapter teaches binbook to render one kind of component. [Adapters overview](adapters/README.md)
explains how they are chosen and compares them.

| Adapter | Renders |
| --- | --- |
| [HTML](adapters/html.md) | Plain HTML templates with `{{arg}}` placeholders |
| [React](adapters/react.md) | React components, server-rendered and hydrated |
| [Vue](adapters/vue.md) | Vue 3 single-file components, server-rendered and hydrated |
| [Svelte](adapters/svelte.md) | Svelte 5 components, server-rendered and hydrated |
| [Web Components](adapters/web-components.md) | Custom elements, vanilla or Lit |
| [Templates](adapters/templates.md) | Handlebars, Nunjucks, EJS, or an engine you supply |
| [Umbraco](adapters/umbraco.md) | Razor views offline, or full Umbraco partials and Block List blocks against a running site |

## Extending and contributing

| Page | What it covers |
| --- | --- |
| [Architecture](architecture.md) | Packages, how a story renders, the dev server's HTTP API, the canvas sandbox |
| [Writing an adapter](writing-an-adapter.md) | The `Adapter` interface and the conformance suite |
| [Contributing](contributing.md) | Working on binbook itself: the monorepo, sandboxes, tests, releases |

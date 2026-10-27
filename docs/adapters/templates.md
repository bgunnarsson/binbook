# Templates adapter

Renders server-side templates through a template engine: Handlebars, Nunjucks and EJS are built
in, and any other engine can be plugged in with a few lines.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-templates
pnpm add -D handlebars        # or nunjucks, or ejs: whichever you use
```

The engine libraries are optional peer dependencies. Install only the ones you use; the adapter
loads each the first time a story needs it, and says which package is missing if it is not
installed.

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import templates, { handlebars } from "@bgunnarsson/binbook-adapter-templates";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [templates({ engine: handlebars() })],
  styles: ["./dist/app.css"],
});
```

## Options

| Option | |
| --- | --- |
| `engine` | One engine, or an array of engines. Required |

With an array, each component's file extension picks the engine. With a single engine, that engine
renders every file regardless of extension.

```ts
import templates, { handlebars, nunjucks, ejs } from "@bgunnarsson/binbook-adapter-templates";

adapters: [templates({ engine: [handlebars(), nunjucks(), ejs()] })],
```

## Built-in engines

| Engine | Extensions | Escaping | Notes |
| --- | --- | --- | --- |
| `handlebars()` | `.hbs`, `.handlebars` | `{{x}}` escapes, `{{{x}}}` is raw | Compiles with the `handlebars` module's shared instance; for custom helpers or partials, wrap it in your own engine (below) |
| `nunjucks()` | `.njk`, `.nunjucks` | Autoescape on; `{{ x \| safe }}` for raw | No loader is configured, so `{% include %}` and `{% extends %}` do not resolve |
| `ejs()` | `.ejs` | `<%= x %>` escapes, `<%- x %>` is raw | `include()` resolves relative to the template file |

Args are the template's data: `{{label}}` in Handlebars, `{{ label }}` in Nunjucks, `<%= label %>`
in EJS.

```handlebars
{{!-- src/card/card.hbs --}}
<article class="card card--{{variant}}">
  <h3 class="card__title">{{title}}</h3>
  {{#if body}}<p class="card__body">{{body}}</p>{{/if}}
</article>
```

```json
{
  "title": "Components/Card",
  "component": "./card.hbs",
  "args": {
    "title": { "type": "text", "default": "Card title" },
    "body": { "type": "text", "default": "Some supporting copy." },
    "variant": { "type": "select", "options": ["default", "elevated", "outlined"], "default": "default" }
  },
  "stories": [{ "name": "Default", "args": {} }, { "name": "No body", "args": { "body": "" } }]
}
```

## Your own engine

An engine is an object with a name, the extensions it claims, and a `render` function that turns
template source and args into HTML. It may be async.

```ts
import type { TemplateEngine } from "@bgunnarsson/binbook-adapter-templates";
import { Liquid } from "liquidjs";

const engine = new Liquid();

export function liquid(): TemplateEngine {
  return {
    name: "liquid",
    extensions: [".liquid"],
    render(source, args) {
      return engine.parseAndRender(source, args);
    },
  };
}
```

```ts
adapters: [templates({ engine: [handlebars(), liquid()] })],
```

`render` receives the absolute path of the template as `file` and the project root as `root`, for
engines that resolve includes. You can wrap a built-in library the same way to register helpers or
configure a loader, for example a Nunjucks `Environment` with a `FileSystemLoader` pointed at your
template folder.

## Behaviour

Templates render to static markup. For behaviour, add your built JavaScript through
[`scripts`](../configuration.md#scripts).

## Docs and watching

The Code tab and Docs view show the template. Saving it or the story file re-renders the story.
Partials and included files are not watched.

## Example

`examples/templates-sandbox`: Handlebars button, card and counter.

# HTML adapter

Renders plain HTML files, replacing `{{name}}` placeholders with the story's args. No framework, no
build step and no dependencies.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-html
```

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import html from "@bgunnarsson/binbook-adapter-html";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [html()],
  styles: ["./dist/app.css"],
});
```

`html()` takes no options.

## Templates

`component` points at an HTML file relative to the story file. Each `{{name}}` is replaced with
the arg of that name. Spaces inside the braces are allowed (`{{ label }}`); names are letters,
digits and `_`.

```html
<!-- src/alert/alert.html -->
<div class="alert alert--{{tone}}" role="alert" {{hidden}}>
  <strong>{{heading}}</strong>
  <p>{{message}}</p>
</div>
```

| Arg value | Renders as |
| --- | --- |
| string, number | The value, HTML-escaped |
| `true` | The arg's **name**, so `{{disabled}}` becomes `disabled` |
| `false` | Nothing |
| `null`, missing | Nothing |
| object, array | `[object Object]` or the comma-joined items; avoid |

The boolean rule is what makes attributes work: name the arg after the attribute it toggles.

```html
<button {{disabled}}>Save</button>   <!-- disabled: true  → <button disabled>Save</button> -->
                                     <!-- disabled: false → <button >Save</button>         -->
```

Values are always escaped, so an arg cannot inject markup. There is no raw output, and there are
no conditionals, loops or partials. If you need those, use the [Templates](templates.md) adapter.

## Behaviour

HTML components render as static markup. For behaviour, add your site's built JavaScript through
[`scripts`](../configuration.md#scripts); it runs against the story markup inside the canvas each
time the story renders. A `<script>` inside the HTML file also runs, since the canvas allows
scripts.

## Docs and watching

The Code tab and Docs view show the HTML file. Saving the HTML file or the story file re-renders
the story.

## Example

`examples/html-sandbox` in this repository: a button, a card and a counter.

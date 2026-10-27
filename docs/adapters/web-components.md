# Web Components adapter

Renders custom elements, written by hand or with [Lit](https://lit.dev). The story markup is the
element's tag with the args as attributes; a bundle of the component's module defines the element
in the canvas, and the element renders itself there.

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-web-components
```

Install `lit` 3 or newer too if your components use it.

```ts
import { defineConfig } from "@bgunnarsson/binbook-core";
import webComponents from "@bgunnarsson/binbook-adapter-web-components";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [webComponents()],
});
```

`webComponents()` takes no options.

## Components

`component` is the `.js` or `.ts` module that registers the element, relative to the story file.
The adapter finds the tag name in the source, from `customElements.define("my-button", …)` or
`@customElement("my-button")`. If the tag is defined some other way, name it after `#`:

```json
{ "component": "./my-button.js#my-button" }
```

### Vanilla

```js
// src/button/my-button.js
class MyButton extends HTMLElement {
  static observedAttributes = ["label", "variant", "disabled"];

  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  render() {
    const label = this.getAttribute("label") ?? "";
    const variant = this.getAttribute("variant") ?? "primary";
    const disabled = this.hasAttribute("disabled");
    this.innerHTML = `<button class="btn btn--${variant}" ${disabled ? "disabled" : ""}>${label}</button>`;
  }
}

customElements.define("my-button", MyButton);
```

### Lit

```ts
// src/counter/lit-counter.ts
import { LitElement, html } from "lit";
import { customElement, property, state } from "lit/decorators.js";

@customElement("lit-counter")
export class LitCounter extends LitElement {
  @property({ type: String }) label = "Count";
  @property({ type: Number }) step = 1;
  @state() private count = 0;

  render() {
    return html`
      <button @click=${() => (this.count -= this.step)}>−</button>
      <output>${this.label}: ${this.count}</output>
      <button @click=${() => (this.count += this.step)}>+</button>
    `;
  }
}
```

Lit's decorators compile without any tsconfig settings of your own; the adapter turns on
`experimentalDecorators` for the bundle.

## How args become attributes

```json
{ "label": "Save", "count": 3, "disabled": true, "hidden": false }
```

renders

```html
<my-button label="Save" count="3" disabled></my-button>
```

- Strings and numbers become `name="value"`, escaped.
- `true` adds the bare attribute, `false` leaves it out.
- `null` and missing args are left out.

Arg names are used as attribute names unchanged. Lit maps the attribute `label` to the property
`label` by default; for a camelCase property, either give it an `attribute` option
(`@property({ attribute: "max-items" }) maxItems`) and name the arg `max-items`, or keep property
names lowercase.

## Styles

Shadow DOM styles (Lit's `static styles`, or a `<style>` you put in the shadow root) work as
normal. Page CSS from [`styles`](../configuration.md#styles) reaches light-DOM markup and anything
that pierces the shadow root, such as inherited properties and custom properties.

Imports of `.css`, `.scss`, `.svg`, `.png` and `.jpg` files in the component module are replaced
with empty modules.

## Rendering

There is no server rendering: the canvas receives the bare tag, and the element renders once the
bundle defines it. The bundle includes the component and everything it imports, Lit included, and
is rebuilt when the component file changes.

## Docs and watching

The Code tab and Docs view show the component module. Saving it or the story file re-renders the
story.

## Example

`examples/wc-sandbox`: vanilla `my-button` and `my-card`, and a Lit `lit-counter`.

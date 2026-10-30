# @bgunnarsson/binbook-adapter-astro

## 2.1.0

### Minor Changes

- fbc04fc: A new adapter renders `.astro` components through the project's own `astro dev`, with its scoped
  styles, global CSS and fonts. An Astro integration adds the render endpoint to the dev server; `.astro`
  decorators wrap stories with a default slot.

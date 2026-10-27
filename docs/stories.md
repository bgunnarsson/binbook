# Writing stories

A story file is a JSON file, usually named `<component>.binbook.json` and kept next to the
component it describes. One file describes one component and any number of named **variants**
of it. Each variant is a leaf in the sidebar.

```json
{
  "title": "Components/Card",
  "description": "A content card with an optional image.",
  "component": "./Card.tsx",
  "wrapper": { "maxWidth": "360px" },
  "args": {
    "heading": { "type": "text", "default": "Card title" },
    "tone": { "type": "select", "options": ["neutral", "info", "danger"], "default": "neutral" },
    "elevated": { "type": "boolean", "default": false, "label": "Raised" },
    "columns": { "type": "number", "default": 1 },
    "accent": { "type": "color", "default": "#3b5bdb" }
  },
  "stories": [
    { "name": "Default", "args": {} },
    { "name": "Danger", "args": { "tone": "danger", "heading": "Something went wrong" } },
    { "name": "Wide", "args": { "columns": 3 }, "wrapper": "max-width: 960px" }
  ]
}
```

## Fields

| Field | Required | |
| --- | --- | --- |
| `title` | yes | Sidebar path, split on `/` |
| `component` | yes | The file the adapter renders, relative to the story file |
| `stories` | yes | One or more named variants |
| `args` | no | The component's inputs and their controls |
| `description` | no | Shown at the top of the Docs view |
| `wrapper` | no | Inline CSS for the box the component renders in |
| `decorators` | no | Provider modules wrapped around the component |
| `umbraco` | no | Umbraco adapter options; ignored by other adapters |

Unknown fields are ignored.

### `title`

Where the story sits in the sidebar. Each `/` adds a level, so `"Forms/Inputs/Text field"` nests
**Text field** under **Inputs** under **Forms**. Stories with the same prefix share groups.

The title is also the story's id: it is lower-cased and every run of characters other than `a–z`
and `0–9` becomes `-`, giving `forms-inputs-text-field`. The id appears in shareable URLs, so
renaming a title breaks old links to it. Two stories whose titles produce the same id collide;
keep titles unique.

### `component`

The file to render, relative to the story file. What the path means is up to the adapter:

| Adapter | `component` |
| --- | --- |
| HTML | `./button.html` |
| React | `./Button.tsx`, or `./Button.tsx#PrimaryButton` for a named export |
| Vue | `./Button.vue` |
| Svelte | `./Button.svelte` |
| Web Components | `./my-button.js`, or `./my-button.js#my-button` to name the tag |
| Templates | `./card.hbs`, `./card.njk`, `./card.ejs` |
| Umbraco (offline) | `./Button.cshtml` |
| Umbraco (live) | A site path such as `~/Views/Partials/Hero.cshtml` |

### `description`

Free text shown under the title in the Docs view. Plain text, not Markdown.

### `args`

The component's inputs. Each key is an arg name and each value describes it:

| Key | |
| --- | --- |
| `type` | One of `text`, `select`, `boolean`, `number`, `color` |
| `default` | The value used when neither the variant nor the user sets one |
| `options` | The choices for a `select`. Required and non-empty for `select` |
| `label` | Shown in the Controls tab instead of the arg name |

The type picks the control in the Controls tab:

| `type` | Control | Value sent to the component |
| --- | --- | --- |
| `text` | Text input | string |
| `select` | Buttons for up to four options, a dropdown for more | string |
| `boolean` | Switch | `true` / `false` |
| `number` | Slider from 0 to 100, or to twice the current value when that is larger | number |
| `color` | Color picker | hex string, e.g. `"#3b5bdb"` |

How the values reach the component depends on the adapter: props for React, Vue and Svelte,
attributes for web components, template variables for HTML and template engines, and `@Model`
for Razor. Each adapter page shows how.

`default` can be any JSON value, and a variant can set an arg to any JSON value too, including
objects and arrays the Controls tab cannot edit. That is a way to pass structured data, such as a
list of menu items, into a component that needs it.

Only declared args are passed. A key a variant sets that is not in `args` is dropped.

### `stories`

The variants: at least one, each with a `name` and the args it overrides.

```json
"stories": [
  { "name": "Default", "args": {} },
  { "name": "Disabled", "args": { "disabled": true } }
]
```

When a variant renders, each arg gets its value from the first of these that has one:

1. What the user set in the Controls tab, or what the URL carries.
2. The variant's `args`.
3. The arg's `default`.

Names must be unique within a file; the sidebar and the URL address a variant by name.

### `wrapper`

Inline CSS for a `<div class="binbook-wrapper">` that the canvas puts around the component. Use it
when a component needs a width or padding to look right on its own: a full-width card, a dropdown
that needs room to open.

As a string of declarations:

```json
"wrapper": "width: 400px; padding: 24px"
```

Or as an object, where camelCase keys become kebab-case:

```json
"wrapper": { "maxWidth": "400px", "margin": "0 auto" }
```

A variant's `wrapper` replaces the story's for that variant. Leave it out, or make it empty, and the
component renders with no wrapper element.

### `decorators`

Modules wrapped around the component before it renders, for components that need a provider: a
router, a store, a theme, an i18n context.

```json
"decorators": ["../decorators/withRouter.tsx", "../decorators/providers.tsx#WithStore"]
```

Paths are relative to the story file. The first entry is outermost. Decorators from the config
wrap outside these. See [Decorators](decorators.md).

### `umbraco`

Options read only by the Umbraco adapter: the render mode, the content node to render against,
and Block List manifests. See [Umbraco](adapters/umbraco.md).

## Editor support

There is no published JSON schema yet. If your editor flags the file, associate `*.binbook.json`
with JSON and turn off schema validation for it.

## Organising stories

- Keep the story next to its component. The `component` path stays short and the pair moves
  together.
- Use the first title segment for broad groups (`Components`, `Patterns`, `Pages`), the last for
  the component.
- Name variants after what differs (`Disabled`, `Long text`, `Danger`), not `Story 1`.
- Write a variant for each state that is hard to reach by clicking: errors, empty states,
  very long content.

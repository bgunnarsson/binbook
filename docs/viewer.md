# The viewer

The viewer is the page `binbook dev` serves at <http://localhost:6006>. It has a sidebar of
stories, a toolbar, the canvas the story renders in, and a work panel of tools.

## Sidebar

Stories are grouped by their `title`, one level per `/`, with each variant as a leaf. Groups
collapse and expand.

- **`/`** focuses the filter box. It matches fuzzily against the full path, so `btngh` finds
  *Components / Button / Ghost*.
- **`⌘K`** (`Ctrl+K` on Windows and Linux) opens the command palette: type, then **Enter** opens the
  top match. **Escape** closes it.
- The **theme** select at the foot of the sidebar changes the viewer's look. See [Themes](#themes).

On a narrow window the sidebar becomes a drawer, opened from the menu button in the toolbar.

## Toolbar

- **Canvas / Docs** switches between the rendered story and its [Docs view](#docs-view).
- The breadcrumb shows where the story sits.
- **Viewports** set the canvas width: **↔** responsive (fills the space), **390** (mobile), **768**
  (tablet), **1280** (desktop). The current width is shown beside them.
- The search button opens the command palette.

## Canvas

Each story renders in its own iframe with `sandbox="allow-scripts"`. Scripts run, but the frame
has an opaque origin: it cannot read the viewer, its cookies or its storage, and the viewer's CSS
and React cannot leak into it. Your CSS, from [`styles`](configuration.md#styles), goes into the
frame, so it cannot restyle the viewer either.

The frame reloads whenever the story, variant or args change, so component state, such as a
counter you clicked up, starts over each time. Between changes, interactive components keep their
state while you use them.

The backdrop is the config's [`background`](configuration.md#background). With
`"transparent"`, a checkerboard shows through.

## Work panel

Under the canvas, or to its right: the button on the panel's tab bar docks it to the other side.
Drag its edge to resize it, or focus the edge and use the arrow keys (`Shift` for bigger steps).
The dock side and size are remembered in your browser.

### Controls

One control per arg in the story file. Changing a control re-renders the story with the new value
at once. See [args](stories.md#args) for which control each type gets.

Control values override the variant's args and are kept in the URL, so a link reproduces exactly
what you see. Switching variants starts from that variant's args again.

### Actions

A log of the DOM events in the canvas: `click`, `input`, `change` and `submit`, each with the
element's `aria-label`, `name` or text, and for inputs the value. Use it to check that a component
responds to the events you expect. **Clear** empties the log; so does picking another story.

The log records events. It does not record your component's callbacks or custom events.

### Accessibility

Runs [axe-core](https://github.com/dequelabs/axe-core) on the rendered story, inside the canvas
frame, and lists each violation with its impact, rule, description and number of affected nodes.
The tab shows a count badge when there are violations. The check runs only while this tab is open:
opening it re-renders the story with axe loaded, and every re-render after that checks again.

axe checks what can be checked automatically. A clean result is a floor, not a pass: keyboard use,
focus order and screen reader output still need checking by hand.

### Code

The component's source file, with a copy button.

## Docs view

**Docs** in the toolbar shows a page for the selected story: its title and `description`, a
**Props** table listing each arg with its control and default, and **Usage**, the component's
source.

## Themes

The theme select in the sidebar changes the viewer's colours. It does not touch the canvas.
**Default** follows your OS: a light palette in light mode, a dark one in dark mode. The others are
fixed palettes: Cloud, Geist, Material, Catppuccin Mocha, Carbon, Primer, Radix, Atlassian, Apple,
Polaris, Linear, Tokyo Night, Rosé Pine, Dracula, Gruvbox and One Dark.

Your choice is stored in the browser and applies to every binbook project on that origin.

## Shareable URLs

The URL holds the current selection:

```
http://localhost:6006/?story=components-button&v=Ghost&vp=mobile&args={"label":"Buy"}
```

| Parameter | |
| --- | --- |
| `story` | The story id: the `title`, lower-cased, with other characters as `-` |
| `v` | Variant name |
| `vp` | Viewport: `mobile`, `tablet` or `desktop`. Absent means responsive |
| `args` | JSON object of the args changed in Controls |

Refreshing keeps your place, and the browser's Back and Forward move between stories. A link
whose variant no longer exists opens the story's first variant. Malformed `args` are ignored.

## Hot reload

Saving the open story's component or story file re-renders it in place, keeping the selection
and your control values. Only the canvas updates: the sidebar, Controls and Docs keep what they
loaded. Refresh the page after adding a story, renaming one, or changing its args or variants.

A new story file is not watched until the server re-scans, which happens on the next change to any
watched file. If a new story still does not appear after a refresh, save it again or restart
`binbook dev`. Changes to `binbook.config.ts` always need a restart.

## Remembered settings

The viewer stores these in your browser's `localStorage`:

| Key | |
| --- | --- |
| `binbook:theme` | Theme |
| `binbook:dock` | Work panel side |
| `binbook:bottomPanelHeight` | Work panel height when docked below |
| `binbook:rightPanelWidth` | Work panel width when docked right |

Clear them to reset the layout.

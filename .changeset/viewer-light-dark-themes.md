---
"@bgunnarsson/binbook-viewer": minor
---

The viewer has themes. A select at the foot of the sidebar picks one: Default
follows the OS with Cloud (cool white, slate text, indigo accent)
in light and Geist (near-black, `#ededed` text, a white primary) in dark, and
the rest are dark palettes after well-known design systems and editor themes:
Material, Catppuccin Mocha, Carbon, Primer, Radix, Atlassian, Apple, Polaris,
Linear, Tokyo Night, Rosé Pine, Dracula, Gruvbox and One Dark. The choice is
remembered, and other open viewer tabs follow it. Alongside it the chrome is
restyled: Poppins for the UI with JetBrains Mono kept for code, borderless
inputs, segmented controls for Canvas/Docs and the viewport sizes, a soft
highlight for the selected story, and count pills on the panel tabs.

The canvas iframe now shows a project's configured `background` in dark themes
too; before, the browser painted a white backdrop over it.

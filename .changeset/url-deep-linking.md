---
"@bgunnarsson/binbook-viewer": minor
---

Deep-link viewer state to the URL. The selected story, variant, live args, and
viewport now round-trip through the query string (`?story=…&v=…&vp=…&args=…`),
so links are shareable and survive a refresh. Selecting a different story pushes
a history entry (browser Back/Forward walks between stories) while tweaking args
or the viewport replaces the current entry, keeping the history stack clean.

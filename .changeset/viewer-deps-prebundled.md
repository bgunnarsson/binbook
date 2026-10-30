---
"@bgunnarsson/binbook-core": patch
---

The viewer no longer loads blank when binbook is installed from npm. Its React
and zustand dependencies are pre-bundled even though the viewer sits in
`node_modules`, where Vite's dependency scan does not look.

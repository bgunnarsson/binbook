# @bgunnarsson/binbook-adapter-umbraco

Renders Umbraco partials and Block List blocks, plus plain .NET Razor components, in
[binbook](https://github.com/bgunnarsson/binbook).

```bash
pnpm add -D @bgunnarsson/binbook-core @bgunnarsson/binbook-adapter-umbraco
```

| Mode | Renders | Needs |
| --- | --- | --- |
| `offline` (default) | `.cshtml` components, Tag Helpers, layouts | The .NET 8 SDK |
| `live` | Full Umbraco partials and Block Lists against real content | Your site running, with a render endpoint |

The full documentation, covering config, both modes, the render endpoint and Block List showcases,
is at
[docs/adapters/umbraco.md](https://github.com/bgunnarsson/binbook/blob/main/docs/adapters/umbraco.md).

The reference endpoint for live mode is in
[`samples/BinbookRenderController.cs`](https://github.com/bgunnarsson/binbook/blob/main/packages/adapter-umbraco/samples/BinbookRenderController.cs).

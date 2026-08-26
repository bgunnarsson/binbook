---
"@bgunnarsson/binbook-adapter-umbraco": minor
---

Add a `headers` option to the Umbraco adapter for authenticating `live`-mode
requests to the render endpoint. A dev render endpoint shouldn't be anonymously
callable, but Umbraco 14+ backoffice auth uses OpenIddict bearer tokens (no
copyable cookie), so the Node adapter proves itself with a header instead — most
simply a shared dev secret:

```ts
umbraco({
  umbracoEndpoint: "https://localhost:44300/binbook/render",
  headers: { "X-Binbook-Secret": process.env.BINBOOK_UMBRACO_SECRET ?? "" },
})
```

The headers are sent with every endpoint request (render, block `list`, block
render, and source lookups). A 401/403 from the endpoint now surfaces a message
pointing at this option. The sample `BinbookRenderController` guards on the
`Binbook:Secret` config value compared against `X-Binbook-Secret`.

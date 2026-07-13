import { defineConfig } from "@bgunnarsson/binbook-core";
import templates, { handlebars } from "@bgunnarsson/binbook-adapter-templates";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  // One adapter, a pluggable engine. Pass an array — e.g. `[handlebars(),
  // nunjucks()]` — to mix engines and resolve by the component's file extension.
  adapters: [templates({ engine: handlebars() })],
  background: "#ffffff",
  styles: ["./src/styles/app.css"],
  // Overridable via env so the e2e suite can run this sandbox on its own port.
  port: process.env.BINBOOK_PORT ? Number(process.env.BINBOOK_PORT) : undefined,
});

import { defineConfig } from "@bgunnarsson/binbook-core";
import html from "@bgunnarsson/binbook-adapter-html";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [html()],
  background: "#000000",
  styles: ["./src/styles/app.css"],
  // Overridable via env so the e2e suite can run this sandbox on a fixed port.
  port: process.env.BINBOOK_PORT ? Number(process.env.BINBOOK_PORT) : undefined,
});

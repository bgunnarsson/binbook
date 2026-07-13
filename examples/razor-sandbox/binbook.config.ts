import { defineConfig } from "@bgunnarsson/binbook-core";
import razor from "@bgunnarsson/binbook-adapter-razor";

export default defineConfig({
  stories: ["src/**/*.binbook.json"],
  adapters: [
    razor({
      // Point at your running Umbraco site to enable `mode: "umbraco"` stories
      // (see src/hero/hero.binbook.json.example). Env-overridable for local dev.
      umbracoEndpoint: process.env.BINBOOK_UMBRACO_ENDPOINT,
    }),
  ],
  background: "#ffffff",
  styles: ["./src/styles/app.css"],
  // Overridable via env so the e2e suite can run this sandbox on a fixed port.
  port: process.env.BINBOOK_PORT ? Number(process.env.BINBOOK_PORT) : undefined,
});

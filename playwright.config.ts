import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: [
    {
      command: "pnpm --filter @bgunnarsson/html-sandbox dev",
      url: "http://localhost:6006",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // React sandbox on a fixed port, for the hydration spec.
      command: "BINBOOK_PORT=6099 pnpm --filter @bgunnarsson/react-sandbox dev",
      url: "http://localhost:6099",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Templates (Handlebars) sandbox on a fixed port, for the templates spec.
      command: "BINBOOK_PORT=6098 pnpm --filter @bgunnarsson/templates-sandbox dev",
      url: "http://localhost:6098",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Svelte sandbox on a fixed port, for the svelte hydration spec.
      command: "BINBOOK_PORT=6097 pnpm --filter @bgunnarsson/svelte-sandbox dev",
      url: "http://localhost:6097",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Web-components (vanilla + Lit) sandbox on a fixed port.
      command: "BINBOOK_PORT=6096 pnpm --filter @bgunnarsson/wc-sandbox dev",
      url: "http://localhost:6096",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
    {
      // Vue sandbox on a fixed port, for the vue hydration spec.
      command: "BINBOOK_PORT=6095 pnpm --filter @bgunnarsson/vue-sandbox dev",
      url: "http://localhost:6095",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  use: { baseURL: "http://localhost:6006" },
});

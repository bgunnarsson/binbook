import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  webServer: {
    command: "pnpm --filter @bgunnarsson/html-sandbox dev",
    url: "http://localhost:6006",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  use: { baseURL: "http://localhost:6006" },
});

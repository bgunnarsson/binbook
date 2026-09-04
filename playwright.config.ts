import { defineConfig } from '@playwright/test'
import { SANDBOXES, baseURL } from './e2e/ports'

export default defineConfig({
  testDir: './e2e',
  // One dev server per sandbox, each on its fixed port (see e2e/ports.ts).
  webServer: Object.values(SANDBOXES).map(({ port, pkg }) => ({
    command: `BINBOOK_PORT=${port} pnpm --filter ${pkg} dev`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  })),
  // Specs that don't override it (background, loop) target the HTML sandbox.
  use: { baseURL: baseURL('html') },
})

import { test, expect } from '@playwright/test'
import { baseURL } from './ports'

// The Umbraco sandbox renders via the bundled .NET host; runs on its own port.
test.use({ baseURL: baseURL('umbraco') })

test('umbraco adapter renders a component through the .NET host and applies project CSS', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Button', { exact: true }).click()
  await page.getByText('Ghost', { exact: true }).first().click()

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe')
  const button = frame.locator('button.btn')
  // The first render starts the dotnet host and compiles the view at runtime,
  // which on a busy CI runner takes longer than the default five seconds.
  await expect(button).toHaveText('Ghost', { timeout: 30_000 })
  await expect(button).toHaveClass(/btn--ghost/)
})

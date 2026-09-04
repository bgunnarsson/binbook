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
  await expect(button).toHaveText('Ghost')
  await expect(button).toHaveClass(/btn--ghost/)
})

import { test, expect } from '@playwright/test'
import { baseURL } from './ports'

// The web-components sandbox runs on its own port; see playwright.config.
test.use({ baseURL: baseURL('wc') })

test('vanilla custom element renders and reflects control edits', async ({ page }) => {
  await page.goto('/')
  await page.getByText('Button', { exact: true }).click()
  await page.getByText('Ghost', { exact: true }).first().click()

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe')
  const button = frame.locator('my-button button.btn')
  await expect(button).toHaveText('Ghost')
  await expect(button).toHaveClass(/btn--ghost/)

  // Editing a control re-renders the element with the new attribute.
  await page.getByLabel('label').fill('Purchase')
  await expect(button).toHaveText('Purchase')
})

test('lit component is interactive: state persists with no server round-trip', async ({ page }) => {
  const consoleErrors: string[] = []
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))

  await page.goto('/')
  await page.getByText('Counter', { exact: true }).click()
  await page.getByText('Default', { exact: true }).first().click()

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe')
  const count = frame.getByLabel('count') // Playwright pierces the open shadow root
  await expect(count).toHaveText(/Count:\s*0/)

  const inc = frame.getByLabel('increment')
  await inc.click()
  await inc.click()
  await inc.click()
  await expect(count).toHaveText(/Count:\s*3/)
  expect(consoleErrors).toEqual([])
})

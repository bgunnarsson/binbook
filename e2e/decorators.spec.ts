import { test, expect } from '@playwright/test'
import { baseURL } from './ports'

// Decorators run in the React sandbox: the Nav story uses react-router <Link>,
// which only renders inside a Router supplied by its withRouter decorator.
test.use({ baseURL: baseURL('react') })

test('a decorator provides context (react-router) so the story renders and hydrates', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

  await page.goto('/')
  await page.getByText('Nav', { exact: true }).click()
  await page.getByText('Default', { exact: true }).first().click()

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe')
  // <Link> renders as an <a href> — impossible without a Router in context.
  await expect(frame.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/')
  await expect(frame.getByRole('link', { name: 'About' })).toBeVisible()
  // Clean hydration — no missing-Router throw, no mismatch warnings.
  expect(errors).toEqual([])
})

test('withQueryClient supplies a TanStack Query client so useQuery renders', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', (e) => errors.push(e.message))

  await page.goto('/')
  await page.getByText('UserCard', { exact: true }).click()
  await page.getByText('Default', { exact: true }).first().click()

  const frame = page.frameLocator('[data-testid="canvas-frame"] iframe')
  // useQuery would throw "No QueryClient set" without the decorator.
  await expect(frame.locator('[data-role]')).toHaveText('Member')
  expect(errors).toEqual([])
})

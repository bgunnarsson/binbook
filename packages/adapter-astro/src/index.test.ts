import path from 'node:path'
import { expect, inject, test } from 'vitest'
import type { RenderContext, Story } from '@bgunnarsson/binbook-types'
import astro from './index'
import { RENDER_PATH } from './protocol'
import { fixtures } from '../test/astro-dev'

const story: Story = {
  id: 'components-button',
  title: 'Components/Button',
  component: './Button.astro',
  args: {},
  variants: [],
  file: path.join(fixtures, 'Button.binbook.json'),
}

const ctx = (args: Record<string, unknown>, decorators?: string[]): RenderContext => ({
  story,
  component: './Button.astro',
  args,
  root: fixtures,
  decorators,
})

const url = inject('astroUrl')

test('adapter metadata', () => {
  expect(astro().name).toBe('astro')
  expect(astro().storyGlob).toBe('**/*.binbook.json')
})

test('renders the component with its props and child components', async () => {
  const result = await astro({ astroUrl: url }).render(ctx({ variant: 'ghost', label: 'Buy' }))
  expect(result.html).toMatch(/<button class="btn btn--ghost"/)
  expect(result.html).toMatch(/<span class="label"[^>]*>Buy<\/span>/)
  expect(result.html).not.toContain('<binbook-frame')
  expect(result.baseHref).toBe(url)
})

test('returns the stylesheets of the component and the components it renders', async () => {
  const result = await astro({ astroUrl: url }).render(ctx({ label: 'Buy' }))
  expect(result.assets).toEqual([
    `${url}/Label.astro?astro&type=style&index=0&lang.css`,
    `${url}/Button.astro?astro&type=style&index=0&lang.css`,
  ])
  const css = await fetch(result.assets?.[0] ?? '', { headers: { accept: 'text/css' } }).then((r) => r.text())
  expect(css).toContain('font-weight')
})

test('wraps the component in decorators, with their styles first and their scripts left out', async () => {
  const result = await astro({ astroUrl: url }).render(ctx({ label: 'Buy' }, [path.join(fixtures, 'Frame.astro')]))
  expect(result.html).toMatch(/<div class="frame"[^>]*><button/)
  expect(result.html).not.toContain('<script')
  expect(result.assets?.[0]).toBe(`${url}/frame.css`)
})

test('refuses components outside the Astro project', async () => {
  await expect(astro({ astroUrl: url }).render({ ...ctx({}), component: '../../src/index.ts' })).rejects.toThrow(
    /outside the Astro project/
  )
})

test('refuses a browser calling the render endpoint', async () => {
  const res = await fetch(`${url}${RENDER_PATH}`, {
    method: 'POST',
    headers: { origin: 'https://example.com' },
    body: '{}',
  })
  expect(res.status).toBe(404)
})

test('lets a stylesheet, image or font past the cross-site guard, and not a script', async () => {
  const load = (path: string, dest: string) =>
    fetch(`${url}${path}`, {
      headers: { 'sec-fetch-site': 'cross-site', 'sec-fetch-mode': 'no-cors', 'sec-fetch-dest': dest },
    })
  const style = await load('/frame.css', 'style')
  expect(style.status).toBe(200)
  expect(style.headers.get('access-control-allow-origin')).toBeNull()
  expect((await load('/frame.css', 'font')).headers.get('access-control-allow-origin')).toBe('*')
  expect((await load('/Frame.astro?astro&type=script&index=0&lang.ts', 'script')).status).toBe(403)
})

test('says when astro dev is not running', async () => {
  await expect(astro({ astroUrl: 'http://localhost:9' }).render(ctx({}))).rejects.toThrow(/could not reach astro dev/)
})

test('docs returns the component source', async () => {
  const docs = await astro().docs?.(story)
  expect(docs?.source).toMatch(/btn--\$\{variant\}/)
})

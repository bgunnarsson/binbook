import { test, expect } from 'vitest'
import { resolveCanvasConfig } from './canvas-config'

test('defaults to white with no styles or scripts', () => {
  expect(resolveCanvasConfig({ stories: [], adapters: [] })).toEqual({
    background: '#ffffff',
    styles: [],
    scripts: [],
  })
})

test('keeps a configured background and maps styles to indexed raw-css URLs', () => {
  const cfg = resolveCanvasConfig({
    stories: [],
    adapters: [],
    background: '#1a1a2e',
    styles: ['./src/app.css', 'theme/b.css'],
  })
  expect(cfg.background).toBe('#1a1a2e')
  expect(cfg.styles).toEqual(['/__binbook_style/0.css', '/__binbook_style/1.css'])
})

test('maps scripts to per-entry directory URLs keyed by basename', () => {
  const cfg = resolveCanvasConfig({
    stories: [],
    adapters: [],
    scripts: ['wwwroot/build/main.js', 'assets/widgets/entry.js'],
  })
  // The basename lets the entry's relative chunk imports resolve to siblings
  // under the same `/__binbook_script/<i>/` directory.
  expect(cfg.scripts).toEqual(['/__binbook_script/0/main.js', '/__binbook_script/1/entry.js'])
})

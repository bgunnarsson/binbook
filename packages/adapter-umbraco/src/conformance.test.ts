import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { describe, beforeAll, afterAll } from 'vitest'
import { runAdapterConformance } from '@bgunnarsson/binbook-adapter-conformance'
import type { Story } from '@bgunnarsson/binbook-types'
import umbraco from './index'
import { dotnetAvailable, buildHost, sharedHost } from './host-client'

const dir = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(dir, '../test/fixtures')

const story: Story = {
  id: 'components-button',
  title: 'Components/Button',
  component: './Button.cshtml',
  args: {},
  variants: [],
  file: path.join(root, 'Button.binbook.json'),
}

// Warm the host (build + first compile) before the shared conformance tests run,
// so their default timeouts aren't spent on cold-start work. Skipped without .NET.
describe.skipIf(!dotnetAvailable())('umbraco adapter conformance', () => {
  beforeAll(async () => {
    await buildHost()
    await sharedHost().render(path.join(root, 'Button.cshtml'), { variant: 'ghost', label: 'Buy' })
  }, 300_000)
  afterAll(() => sharedHost().dispose())

  runAdapterConformance(umbraco, {
    story,
    root,
    args: { variant: 'ghost', label: 'Buy' },
    expectedHtmlIncludes: 'btn--ghost',
  })
})

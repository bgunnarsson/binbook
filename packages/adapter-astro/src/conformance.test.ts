import path from 'node:path'
import { inject } from 'vitest'
import { runAdapterConformance } from '@bgunnarsson/binbook-adapter-conformance'
import type { Story } from '@bgunnarsson/binbook-types'
import astro from './index'
import { fixtures } from '../test/astro-dev'

const story: Story = {
  id: 'components-button',
  title: 'Components/Button',
  component: './Button.astro',
  args: {},
  variants: [],
  file: path.join(fixtures, 'Button.binbook.json'),
}

runAdapterConformance(() => astro({ astroUrl: inject('astroUrl') }), {
  story,
  root: fixtures,
  args: { variant: 'ghost', label: 'Buy' },
  expectedHtmlIncludes: 'btn--ghost',
})

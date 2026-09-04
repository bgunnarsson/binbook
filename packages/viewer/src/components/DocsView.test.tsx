import { render, screen, waitFor } from '@testing-library/react'
import { test, expect, vi, beforeEach } from 'vitest'

vi.mock('../api', () => ({
  fetchDocs: vi.fn(async () => ({ source: '<button class="btn btn--{{variant}}">{{label}}</button>' })),
  renderStory: vi.fn(async () => ({ html: '<button>Hi</button>' })),
}))

import { DocsView } from './DocsView'
import { useStore } from '../store'
import type { Story } from '@bgunnarsson/binbook-types'

const story: Story = {
  id: 'components-button',
  title: 'Components/Button',
  description: 'Primary CTA.',
  component: './button.html',
  args: {
    label: { type: 'text', default: 'Click me' },
    variant: { type: 'select', options: ['primary', 'ghost'], default: 'primary' },
  },
  variants: [{ name: 'Default', args: {} }],
  file: '/x',
}

beforeEach(() => {
  useStore.setState({ selected: { storyId: 'components-button', variant: 'Default' }, stories: [story] })
})

test('docs view shows description, args table, and source', async () => {
  render(<DocsView />)
  expect(screen.getByText('Primary CTA.')).toBeInTheDocument()
  expect(screen.getByRole('table')).toBeInTheDocument()
  expect(screen.getByText('label')).toBeInTheDocument()
  expect(screen.getByText('variant')).toBeInTheDocument()
  await waitFor(() => expect(screen.getByText(/btn--/)).toBeInTheDocument())
})

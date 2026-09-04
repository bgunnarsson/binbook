import { act, render, waitFor } from '@testing-library/react'
import { test, expect, vi, beforeEach } from 'vitest'

vi.mock('../api', () => ({
  renderStory: vi.fn(async ({ args }: { args?: Record<string, unknown> }) => ({
    html: `<button>${args?.label ?? 'Hi'}</button>`,
  })),
  fetchStories: vi.fn(async () => ({ tree: [], stories: [] })),
}))

import { Canvas } from './Canvas'
import { useStore } from '../store'

beforeEach(() => {
  useStore.setState({
    selected: { storyId: 'components-button', variant: 'Default' },
    liveArgs: {},
    background: '#ffffff',
  })
})

test('renders the selected story html into the iframe srcdoc', async () => {
  const { container } = render(<Canvas />)
  await waitFor(() => {
    const iframe = container.querySelector('iframe')
    expect(iframe?.getAttribute('srcdoc') ?? '').toContain('<button>Hi</button>')
  })
})

test('applies the chosen canvas background to the iframe', async () => {
  useStore.setState({ background: 'rgb(10, 10, 10)' })
  const { container } = render(<Canvas />)
  // Re-query rather than holding a reference: each document remounts the frame.
  await waitFor(() => {
    const iframe = container.querySelector('iframe') as HTMLIFrameElement
    expect(iframe.style.background).toBe('rgb(10, 10, 10)')
  })
})

// Re-rendering a live iframe's srcdoc navigates it, and that navigation joins
// the page's session history — Back would then walk canvas renders instead of
// the viewer's own URL entries. A fresh element replaces its initial
// about:blank instead, so the history stays the viewer's.
test('a new document arrives in a new iframe element', async () => {
  const { container } = render(<Canvas />)
  const first = await waitFor(() => {
    const iframe = container.querySelector('iframe')
    expect(iframe?.getAttribute('srcdoc') ?? '').toContain('<button>Hi</button>')
    return iframe
  })

  await act(async () => useStore.setState({ liveArgs: { label: 'Again' } }))

  await waitFor(() => {
    const iframe = container.querySelector('iframe')
    expect(iframe?.getAttribute('srcdoc') ?? '').toContain('<button>Again</button>')
    expect(iframe).not.toBe(first)
  })
})

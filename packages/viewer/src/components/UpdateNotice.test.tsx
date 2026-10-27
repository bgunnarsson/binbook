import { render, screen, fireEvent } from '@testing-library/react'
import { test, expect, beforeEach } from 'vitest'
import { UpdateNotice } from './UpdateNotice'
import { useStore } from '../store'

const update = { current: '1.0.0', latest: '1.1.0', command: 'pnpm up "@bgunnarsson/binbook-*" --latest' }

beforeEach(() => {
  useStore.setState({ update: null })
})

test('renders nothing when no update was found', () => {
  const { container } = render(<UpdateNotice />)
  expect(container).toBeEmptyDOMElement()
})

test('shows the latest and running versions', () => {
  useStore.setState({ update })
  render(<UpdateNotice />)
  expect(screen.getByText("binbook 1.1.0 is out. You're on 1.0.0.")).toBeInTheDocument()
  expect(screen.getByRole('button', { name: 'Copy update' })).toHaveAttribute('title', update.command)
})

test('dismissing hides the notice', () => {
  useStore.setState({ update })
  render(<UpdateNotice />)
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss update notice' }))
  expect(useStore.getState().update).toBeNull()
  expect(screen.queryByRole('region', { name: 'Update available' })).not.toBeInTheDocument()
})

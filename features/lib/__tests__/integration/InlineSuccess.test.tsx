import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { InlineSuccess } from '@/features/lib/front/components/InlineSuccess'

describe('InlineSuccess', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the message', () => {
    render(<InlineSuccess message="Aisha archived" />)
    expect(screen.getByText('Aisha archived')).toBeInTheDocument()
  })

  it('auto-dismisses after the timeout', () => {
    jest.useFakeTimers()
    render(<InlineSuccess message="Aisha archived" dismissAfterMs={3000} />)
    expect(screen.getByText('Aisha archived')).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(3000) })
    expect(screen.queryByText('Aisha archived')).not.toBeInTheDocument()
  })

  it('calls onDismiss when auto-dismissed', () => {
    jest.useFakeTimers()
    const onDismiss = jest.fn()
    render(<InlineSuccess message="Aisha archived" dismissAfterMs={2000} onDismiss={onDismiss} />)
    act(() => { jest.advanceTimersByTime(2000) })
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('supports manual dismiss via Dismiss button', () => {
    render(<InlineSuccess message="Aisha archived" />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(screen.queryByText('Aisha archived')).not.toBeInTheDocument()
  })

  it('calls onDismiss when manually dismissed', () => {
    const onDismiss = jest.fn()
    render(<InlineSuccess message="Aisha archived" onDismiss={onDismiss} />)
    fireEvent.click(screen.getByRole('button', { name: /dismiss/i }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})

describe('InlineSuccess — with action (Undo extension)', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('renders the action button label when action is provided', () => {
    const onAction = jest.fn()
    render(<InlineSuccess message="Moved Math to Friday" action={{ label: 'Undo', onAction }} />)
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument()
  })

  it('calls onAction when action button is clicked', () => {
    const onAction = jest.fn()
    render(<InlineSuccess message="Moved Math to Friday" action={{ label: 'Undo', onAction }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })

  it('dismisses after clicking action', () => {
    const onAction = jest.fn()
    render(<InlineSuccess message="Moved Math to Friday" action={{ label: 'Undo', onAction }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }))
    expect(screen.queryByText('Moved Math to Friday')).not.toBeInTheDocument()
  })

  it('defaults dismissAfterMs to 8000 when action is set', () => {
    jest.useFakeTimers()
    const onAction = jest.fn()
    render(<InlineSuccess message="Moved Math to Friday" action={{ label: 'Undo', onAction }} />)
    act(() => { jest.advanceTimersByTime(7999) })
    expect(screen.getByText('Moved Math to Friday')).toBeInTheDocument()
    act(() => { jest.advanceTimersByTime(1) })
    expect(screen.queryByText('Moved Math to Friday')).not.toBeInTheDocument()
  })

  it('no-action path is unchanged (default 3000ms dismiss)', () => {
    jest.useFakeTimers()
    render(<InlineSuccess message="Saved" />)
    act(() => { jest.advanceTimersByTime(3000) })
    expect(screen.queryByText('Saved')).not.toBeInTheDocument()
  })

  it('does not render action button when no action provided', () => {
    render(<InlineSuccess message="Saved" />)
    expect(screen.queryByRole('button', { name: 'Undo' })).not.toBeInTheDocument()
  })
})

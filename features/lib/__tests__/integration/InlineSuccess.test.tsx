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

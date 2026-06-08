import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InlineConfirm } from '@/features/lib/front/components/InlineConfirm'

describe('InlineConfirm', () => {
  it('renders the message and detail', () => {
    render(
      <InlineConfirm
        message="Delete this evidence item?"
        detail="My Portfolio Item"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByText('Delete this evidence item?')).toBeInTheDocument()
    expect(screen.getByText('My Portfolio Item')).toBeInTheDocument()
  })

  it('exposes accessible button names', () => {
    render(
      <InlineConfirm
        message="Delete this?"
        confirmLabel="Delete evidence"
        cancelLabel="Cancel delete"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Delete evidence' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel delete' })).toBeInTheDocument()
  })

  it('exposes a group with the message as its accessible label', () => {
    render(
      <InlineConfirm message="Delete this?" onConfirm={jest.fn()} onCancel={jest.fn()} />
    )
    expect(screen.getByRole('group', { name: 'Delete this?' })).toBeInTheDocument()
  })

  it('cancel calls onCancel and not onConfirm', () => {
    const onConfirm = jest.fn()
    const onCancel = jest.fn()
    render(
      <InlineConfirm message="Delete this?" onConfirm={onConfirm} onCancel={onCancel} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('confirm calls onConfirm', async () => {
    const onConfirm = jest.fn().mockResolvedValue(undefined)
    render(
      <InlineConfirm message="Delete this?" onConfirm={onConfirm} onCancel={jest.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1))
  })

  it('shows pendingLabel while the confirm promise is unresolved', async () => {
    let resolve!: () => void
    const onConfirm = jest.fn(() => new Promise<void>(r => { resolve = r }))
    render(
      <InlineConfirm
        message="Delete this?"
        pendingLabel="Deleting…"
        onConfirm={onConfirm}
        onCancel={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await screen.findByText('Deleting…')
    resolve()
    await waitFor(() => expect(screen.queryByText('Deleting…')).not.toBeInTheDocument())
  })

  it('shows an inline error and keeps the panel open when confirm rejects', async () => {
    const onConfirm = jest.fn().mockRejectedValue(new Error('Network failed'))
    render(
      <InlineConfirm message="Delete this?" onConfirm={onConfirm} onCancel={jest.fn()} />
    )
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(await screen.findByText('Network failed')).toBeInTheDocument()
    // panel still open — confirm button still present
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it("tone='warning' applies the amber confirm-button class", () => {
    render(
      <InlineConfirm
        message="Archive this learner?"
        confirmLabel="Archive"
        tone="warning"
        onConfirm={jest.fn()}
        onCancel={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: 'Archive' }).className).toMatch(/bg-amber-600/)
  })
})

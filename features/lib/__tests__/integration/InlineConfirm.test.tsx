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

// Shared lessons: "Just Hawa" or "All learners in this group" — two destructive choices.
describe('InlineConfirm — second choice', () => {
  function renderTwo(onConfirm = jest.fn(), onSecondary = jest.fn(), onCancel = jest.fn()) {
    render(
      <InlineConfirm
        message="Delete this lesson?"
        confirmLabel="All learners in this group"
        secondaryAction={{ label: 'Just Hawa', onConfirm: onSecondary }}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )
    return { onConfirm, onSecondary, onCancel }
  }

  it('shows both choices and Cancel', () => {
    renderTwo()
    expect(screen.getByRole('button', { name: 'Just Hawa' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'All learners in this group' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
  })

  it('the second choice calls its own handler, not onConfirm', async () => {
    const { onConfirm, onSecondary } = renderTwo()
    fireEvent.click(screen.getByRole('button', { name: 'Just Hawa' }))
    await waitFor(() => expect(onSecondary).toHaveBeenCalled())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Cancel calls neither choice', () => {
    const { onConfirm, onSecondary, onCancel } = renderTwo()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
    expect(onSecondary).not.toHaveBeenCalled()
  })

  it('disables every button while either choice is pending', async () => {
    let resolve: () => void = () => {}
    renderTwo(jest.fn(), jest.fn(() => new Promise<void>(r => { resolve = r })))
    fireEvent.click(screen.getByRole('button', { name: 'Just Hawa' }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'All learners in this group' })).toBeDisabled())
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    resolve()
  })

  it('shows an error from the second choice and stays open', async () => {
    renderTwo(jest.fn(), jest.fn().mockRejectedValue(new Error('Could not delete')))
    fireEvent.click(screen.getByRole('button', { name: 'Just Hawa' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not delete')
    expect(screen.getByRole('button', { name: 'Just Hawa' })).toBeInTheDocument()
  })

  it('no second button unless one is given', () => {
    render(<InlineConfirm message="Delete?" onConfirm={jest.fn()} onCancel={jest.fn()} />)
    expect(screen.getAllByRole('button')).toHaveLength(2)
  })
})

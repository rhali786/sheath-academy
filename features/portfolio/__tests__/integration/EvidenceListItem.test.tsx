import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { EvidenceListItem } from '@/features/portfolio/front/components/EvidenceListItem'
import type { EvidenceItem } from '@/features/portfolio/types'

function makeItem(overrides: Partial<EvidenceItem> = {}): EvidenceItem {
  return {
    id: 'evidence_001',
    title: 'Test Evidence',
    childId: 'child_a',
    subjectId: 'sub_a',
    date: '2026-05-12',
    type: 'note',
    notes: 'Some notes here',
    createdBy: 'demo-parent',
    createdAt: '2026-05-12T09:00:00Z',
    updatedAt: '2026-05-12T09:00:00Z',
    ...overrides,
  }
}

describe('EvidenceListItem — read state', () => {
  it('renders the title in read state', () => {
    render(
      <EvidenceListItem
        item={makeItem({ title: 'My Portfolio Item' })}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.getByText('My Portfolio Item')).toBeInTheDocument()
  })

  it('shows Pencil icon button when onUpdate is provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /edit evidence/i })).toBeInTheDocument()
  })

  it('shows Pencil icon button when legacy onEdit is provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /edit evidence/i })).toBeInTheDocument()
  })

  it('shows Trash icon button when onDelete is provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onDelete={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /delete evidence/i })).toBeInTheDocument()
  })

  it('does not show edit/delete buttons when no handlers provided', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
      />
    )
    expect(screen.queryByRole('button', { name: /edit evidence/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /delete evidence/i })).not.toBeInTheDocument()
  })

  it('inline edit form is NOT visible in read state', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    expect(screen.queryByRole('button', { name: /save evidence/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /cancel edit/i })).not.toBeInTheDocument()
  })
})

describe('EvidenceListItem — edit expansion (inline)', () => {
  it('clicking Pencil expands inline edit form with onUpdate', () => {
    render(
      <EvidenceListItem
        item={makeItem({ title: 'Clickable Item' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    expect(screen.getByRole('button', { name: /save evidence/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument()
    // Read state Pencil should not be visible while editing
    expect(screen.queryByRole('button', { name: /edit evidence/i })).not.toBeInTheDocument()
  })

  it('edit form is prefilled with current title', () => {
    render(
      <EvidenceListItem
        item={makeItem({ title: 'Original Title' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    const titleInput = screen.getByDisplayValue('Original Title')
    expect(titleInput).toBeInTheDocument()
  })

  it('Cancel collapses inline form without calling onUpdate', () => {
    const onUpdate = jest.fn()
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel edit/i }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /edit evidence/i })).toBeInTheDocument()
  })

  it('Save calls onUpdate with item id and patch', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <EvidenceListItem
        item={makeItem({ id: 'ev_save', title: 'Original' })}
        childName="Adam"
        subjectName="Math"
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: /save evidence/i }))
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('ev_save', expect.objectContaining({ title: 'Original' }))
    })
  })

  it('clicking Pencil with legacy onEdit calls onEdit (no inline expansion)', () => {
    const onEdit = jest.fn()
    render(
      <EvidenceListItem
        item={makeItem({ id: 'ev_legacy', title: 'Legacy Edit' })}
        childName="Adam"
        subjectName="Math"
        onEdit={onEdit}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit evidence/i }))
    expect(onEdit).toHaveBeenCalledWith(expect.objectContaining({ id: 'ev_legacy' }))
    // No inline form should open
    expect(screen.queryByRole('button', { name: /save evidence/i })).not.toBeInTheDocument()
  })
})

describe('EvidenceListItem — delete confirmation', () => {
  it('shows delete confirmation panel when Trash icon is clicked', () => {
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onDelete={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete evidence/i }))
    expect(screen.getByRole('button', { name: /confirm delete evidence/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel delete/i })).toBeInTheDocument()
  })

  it('Cancel delete hides confirmation and does not call onDelete', () => {
    const onDelete = jest.fn()
    render(
      <EvidenceListItem
        item={makeItem()}
        childName="Adam"
        subjectName="Math"
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel delete/i }))
    expect(onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /delete evidence/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm delete/i })).not.toBeInTheDocument()
  })

  it('Confirm delete calls onDelete with item id', async () => {
    const onDelete = jest.fn().mockResolvedValue(undefined)
    render(
      <EvidenceListItem
        item={makeItem({ id: 'ev_del_123' })}
        childName="Adam"
        subjectName="Math"
        onDelete={onDelete}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete evidence/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm delete evidence/i }))
    await waitFor(() => {
      expect(onDelete).toHaveBeenCalledWith('ev_del_123')
    })
  })
})

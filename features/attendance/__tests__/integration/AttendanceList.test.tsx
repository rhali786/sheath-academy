import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { AttendanceList } from '@/features/attendance/front/components/AttendanceList'
import type { AttendanceRecord } from '@/features/attendance/types'

function makeRecord(overrides: Partial<AttendanceRecord> = {}): AttendanceRecord {
  return {
    id: 'rec_001',
    childId: 'child_001',
    householdId: 'hh_001',
    date: '2026-05-12',
    status: 'present',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const childMap = { child_001: 'Adam' }

describe('AttendanceList — empty state', () => {
  it('shows empty message when records is empty', () => {
    render(
      <AttendanceList
        records={[]}
        childMap={childMap}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByText(/no attendance records yet/i)).toBeInTheDocument()
  })
})

describe('AttendanceList — delete confirmation (Phase 2)', () => {
  it('shows Delete button initially (no confirm UI)', () => {
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument()
    expect(screen.queryByText(/are you sure/i)).not.toBeInTheDocument()
  })

  it('clicking Delete shows inline confirm UI', () => {
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onDelete={jest.fn()}
        onEdit={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^delete$/i })).not.toBeInTheDocument()
  })

  it('clicking Confirm calls onDelete with the record id', () => {
    const onDelete = jest.fn()
    render(
      <AttendanceList
        records={[makeRecord({ id: 'rec_abc' })]}
        childMap={childMap}
        onDelete={onDelete}
        onEdit={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /confirm/i }))
    expect(onDelete).toHaveBeenCalledWith('rec_abc')
  })

  it('clicking Cancel hides confirm UI and does not call onDelete', () => {
    const onDelete = jest.fn()
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onDelete={onDelete}
        onEdit={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onDelete).not.toHaveBeenCalled()
    // Should return to normal state
    expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument()
  })
})

describe('AttendanceList — card click opens edit (Phase 3)', () => {
  it('clicking a record row calls onEdit with that record', () => {
    const onEdit = jest.fn()
    const record = makeRecord({ id: 'rec_xyz', status: 'absent', date: '2026-05-15' })
    render(
      <AttendanceList
        records={[record]}
        childMap={childMap}
        onDelete={jest.fn()}
        onEdit={onEdit}
      />
    )
    // Click the list item itself (not a button)
    const listItem = screen.getByRole('listitem')
    fireEvent.click(listItem)
    expect(onEdit).toHaveBeenCalledWith(record)
  })

  it('clicking the Edit button still calls onEdit', () => {
    const onEdit = jest.fn()
    const record = makeRecord()
    render(
      <AttendanceList
        records={[record]}
        childMap={childMap}
        onDelete={jest.fn()}
        onEdit={onEdit}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /^edit$/i }))
    expect(onEdit).toHaveBeenCalledWith(record)
  })
})

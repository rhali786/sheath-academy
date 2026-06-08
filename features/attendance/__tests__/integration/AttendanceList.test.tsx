import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
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
        onArchive={jest.fn()}
        onUpdate={jest.fn()}
      />
    )
    expect(screen.getByText(/no attendance records yet/i)).toBeInTheDocument()
  })
})

describe('AttendanceList — void confirmation', () => {
  it('shows Void icon button initially (no confirm UI)', () => {
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onArchive={jest.fn()}
        onUpdate={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /void record/i })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /void this record\?/i })).not.toBeInTheDocument()
  })

  it('clicking Void icon shows InlineConfirm attached to the row', () => {
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onArchive={jest.fn()}
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /void record/i }))
    expect(screen.getByRole('group', { name: /void this record\?/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^void$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^cancel$/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /void record/i })).not.toBeInTheDocument()
  })

  it('clicking Confirm void calls onArchive with the record id', () => {
    const onArchive = jest.fn()
    render(
      <AttendanceList
        records={[makeRecord({ id: 'rec_abc' })]}
        childMap={childMap}
        onArchive={onArchive}
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /void record/i }))
    fireEvent.click(screen.getByRole('button', { name: /^void$/i }))
    expect(onArchive).toHaveBeenCalledWith('rec_abc')
  })

  it('clicking Cancel hides InlineConfirm and does not call onArchive', () => {
    const onArchive = jest.fn()
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onArchive={onArchive}
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /void record/i }))
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(onArchive).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /void record/i })).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: /void this record\?/i })).not.toBeInTheDocument()
  })
})

describe('AttendanceList — inline edit expansion', () => {
  it('shows Edit (Pencil) icon button in read state', () => {
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onArchive={jest.fn()}
        onUpdate={jest.fn()}
      />
    )
    expect(screen.getByRole('button', { name: /edit record/i })).toBeInTheDocument()
  })

  it('clicking Edit icon expands inline form', () => {
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onArchive={jest.fn()}
        onUpdate={jest.fn()}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit record/i }))
    expect(screen.getByRole('button', { name: /save record/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument()
  })

  it('Cancel edit collapses form without calling onUpdate', () => {
    const onUpdate = jest.fn()
    render(
      <AttendanceList
        records={[makeRecord()]}
        childMap={childMap}
        onArchive={jest.fn()}
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit record/i }))
    fireEvent.click(screen.getByRole('button', { name: /cancel edit/i }))
    expect(onUpdate).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /edit record/i })).toBeInTheDocument()
  })

  it('Save calls onUpdate with record id and patch', async () => {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <AttendanceList
        records={[makeRecord({ id: 'rec_xyz', status: 'present', date: '2026-05-12' })]}
        childMap={childMap}
        onArchive={jest.fn()}
        onUpdate={onUpdate}
      />
    )
    fireEvent.click(screen.getByRole('button', { name: /edit record/i }))
    fireEvent.click(screen.getByRole('button', { name: /save record/i }))
    await waitFor(() => {
      expect(onUpdate).toHaveBeenCalledWith('rec_xyz', expect.objectContaining({ status: 'present', date: '2026-05-12' }))
    })
  })
})

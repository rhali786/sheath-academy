import React from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AdminMetricsFamilyCard } from '@/features/admin-metrics/front/components/AdminMetricsFamilyCard'
import type { AdminMetricsUserRow } from '@/features/admin-metrics/types'

const baseRow: AdminMetricsUserRow = {
  userId: 'u1',
  userEmail: 'owner@test.com',
  userName: 'Owner User',
  workspaceId: 'hh1',
  workspaceName: 'Test Family',
  isActiveInPeriod: true,
  lastActiveAt: '2026-05-20T10:00:00Z',
  learnerCount: 1,
  learnerNames: ['Amina'],
  lessonTasksInPeriod: 2,
  lessonsCompletedInPeriod: 1,
  attendanceEventsInPeriod: 3,
  sessionsLogged: 2,
  completionEvents: 1,
  startedNotCompletedCount: 0,
  quranRecordsCreated: 0,
  arabicRecordsCreated: 0,
  islamicStudiesRecordsCreated: 0,
  deenRecordsCreated: 0,
  evidenceItemsCreated: 0,
  reportsGenerated: 0,
  featureUsageByArea: {},
  dropOffSignals: [],
  members: [
    { userId: 'u1', email: 'owner@test.com', name: 'Owner User', role: 'owner' },
    { userId: 'u2', email: 'spouse@test.com', name: 'Spouse User', role: 'member' },
  ],
}

const fmt = (iso?: string) => iso ?? '—'

describe('AdminMetricsFamilyCard — member list', () => {
  it('renders collapsed by default without showing member list', () => {
    render(<AdminMetricsFamilyCard row={baseRow} formatLastActive={fmt} formatLastLogin={fmt} />)
    // spouse is a non-owner member only visible in the expanded list
    expect(screen.queryByText(/spouse@test\.com/)).not.toBeInTheDocument()
  })

  it('shows expand button with accessible label', () => {
    render(<AdminMetricsFamilyCard row={baseRow} formatLastActive={fmt} formatLastLogin={fmt} />)
    expect(
      screen.getByRole('button', { name: /show members of test family/i }),
    ).toBeInTheDocument()
  })

  it('expands to show all members when button clicked', async () => {
    const user = userEvent.setup()
    render(<AdminMetricsFamilyCard row={baseRow} formatLastActive={fmt} formatLastLogin={fmt} />)
    await user.click(screen.getByRole('button', { name: /show members of test family/i }))
    // both members visible in expanded list
    expect(screen.getByText(/Spouse User.*spouse@test\.com|spouse@test\.com/)).toBeInTheDocument()
  })

  it('shows Owner badge on owner member, not on member', async () => {
    const user = userEvent.setup()
    render(<AdminMetricsFamilyCard row={baseRow} formatLastActive={fmt} formatLastLogin={fmt} />)
    await user.click(screen.getByRole('button', { name: /show members of test family/i }))
    const badges = screen.getAllByText('Owner')
    expect(badges).toHaveLength(1)
    expect(screen.queryByText('Member')).not.toBeInTheDocument()
  })

  it('collapses back when button clicked again', async () => {
    const user = userEvent.setup()
    render(<AdminMetricsFamilyCard row={baseRow} formatLastActive={fmt} formatLastLogin={fmt} />)
    const btn = screen.getByRole('button', { name: /show members of test family/i })
    await user.click(btn)
    expect(screen.getByText(/spouse@test\.com/)).toBeInTheDocument()
    await user.click(btn)
    expect(screen.queryByText(/spouse@test\.com/)).not.toBeInTheDocument()
  })

  it('renders without members field gracefully', () => {
    const rowNoMembers = { ...baseRow, members: undefined }
    render(<AdminMetricsFamilyCard row={rowNoMembers as AdminMetricsUserRow} formatLastActive={fmt} formatLastLogin={fmt} />)
    expect(screen.getByTestId('admin-metrics-card-hh1')).toBeInTheDocument()
  })
})

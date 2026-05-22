import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  AdminMetricsDashboard,
  emptyCardsMessage,
  formatLastActive,
} from '@/features/admin-metrics/front/components/AdminMetricsDashboard'

jest.mock('@/features/admin-metrics/front/services/api', () => ({
  adminMetricsApi: {
    getSummary: jest.fn(),
    getUsers: jest.fn(),
  },
}))

import { adminMetricsApi } from '@/features/admin-metrics/front/services/api'

const mockGetSummary = adminMetricsApi.getSummary as jest.Mock
const mockGetUsers = adminMetricsApi.getUsers as jest.Mock

const summary = {
  activeUsers: 3,
  activeFamilies: 2,
  learnersCreated: 4,
  sessionsLogged: 10,
  completionEvents: 6,
  deenRecordsCreated: 2,
  evidenceItemsCreated: 3,
  reportsGenerated: 1,
  periodStart: '2026-05-01',
  periodEnd: '2026-05-31',
  previousPeriodComparison: { activeUsersDelta: 1, sessionsDelta: 2, evidenceReportsDelta: 0 },
}

const row = {
  userId: 'u1',
  userEmail: 'a@test.com',
  workspaceId: 'hh1',
  workspaceName: 'Family A',
  isActiveInPeriod: true,
  lastActiveAt: '2026-05-20T10:00:00Z',
  learnerCount: 2,
  learnerNames: ['Amina', 'Yusuf'],
  lessonTasksInPeriod: 4,
  lessonsCompletedInPeriod: 2,
  sessionsLogged: 5,
  completionEvents: 3,
  startedNotCompletedCount: 1,
  quranRecordsCreated: 1,
  arabicRecordsCreated: 0,
  islamicStudiesRecordsCreated: 0,
  deenRecordsCreated: 1,
  evidenceItemsCreated: 1,
  reportsGenerated: 0,
  featureUsageByArea: { planner: 5 },
  dropOffSignals: ['started_not_completed'],
}

describe('AdminMetricsDashboard', () => {
  beforeEach(() => {
    mockGetSummary.mockResolvedValue(summary)
    mockGetUsers.mockResolvedValue({
      rows: [row],
      total: 1,
      page: 1,
      pageSize: 50,
    })
  })

  it('renders hero cards and family card grid', async () => {
    render(<AdminMetricsDashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-metrics-hero')).toBeInTheDocument()
    })
    expect(screen.getByTestId('hero-active-users')).toHaveTextContent('3 users')
    expect(screen.getByTestId('admin-metrics-cards')).toBeInTheDocument()
    expect(screen.getByTestId('admin-metrics-card-hh1')).toBeInTheDocument()
    expect(screen.getByText('a@test.com')).toBeInTheDocument()
    expect(screen.getByText('Amina, Yusuf')).toBeInTheDocument()
    expect(screen.getByText('4 tasks · 2 completed')).toBeInTheDocument()
    expect(screen.getByText(formatLastActive('2026-05-20T10:00:00Z'))).toBeInTheDocument()
    expect(screen.queryByTestId('admin-metrics-table')).not.toBeInTheDocument()
  })

  it('passes search to getUsers on load and Apply', async () => {
    const user = userEvent.setup()
    render(<AdminMetricsDashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-metrics-search')).toBeInTheDocument()
    })

    const search = screen.getByTestId('admin-metrics-search')
    await user.clear(search)
    await user.type(search, 'Family A')
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    await waitFor(() => {
      expect(mockGetUsers).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'Family A' }),
      )
    })
  })

  it('shows filter empty message when search returns no rows', async () => {
    mockGetUsers.mockResolvedValue({ rows: [], total: 0, page: 1, pageSize: 50 })
    const user = userEvent.setup()
    render(<AdminMetricsDashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-metrics-search')).toBeInTheDocument()
    })
    await user.type(screen.getByTestId('admin-metrics-search'), 'zzz')
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() => {
      expect(screen.getByTestId('admin-metrics-empty')).toHaveTextContent(
        'No families match your filter.',
      )
    })
  })

  it('renders metrics glossary with drop-off definitions', async () => {
    render(<AdminMetricsDashboard />)
    const glossary = await screen.findByTestId('admin-metrics-glossary')
    expect(glossary).toHaveTextContent('How to read these metrics')
    expect(glossary).toHaveTextContent('Drop-off signals')
    expect(glossary).toHaveTextContent('Learners created, no activity')
    expect(glossary).toHaveTextContent('Session events')
  })

  it('shows forbidden state on 403', async () => {
    mockGetSummary.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    render(<AdminMetricsDashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-metrics-forbidden')).toBeInTheDocument()
    })
  })
})

describe('emptyCardsMessage', () => {
  it('distinguishes filter empty from period empty', () => {
    expect(emptyCardsMessage({ search: 'x', activeOnly: false, dropOffFilter: '' })).toBe(
      'No families match your filter.',
    )
    expect(emptyCardsMessage({ search: '', activeOnly: true, dropOffFilter: '' })).toBe(
      'No families match your filter.',
    )
    expect(emptyCardsMessage({ search: '', activeOnly: false, dropOffFilter: '' })).toBe(
      'No usage data for this period.',
    )
  })
})

describe('formatLastActive', () => {
  it('returns em dash when missing or invalid', () => {
    expect(formatLastActive()).toBe('—')
    expect(formatLastActive('not-a-date')).toBe('—')
  })

  it('formats ISO timestamps with date and time', () => {
    const formatted = formatLastActive('2026-05-20T10:00:00Z')
    expect(formatted).not.toBe('—')
    expect(formatted).toMatch(/2026/)
  })
})

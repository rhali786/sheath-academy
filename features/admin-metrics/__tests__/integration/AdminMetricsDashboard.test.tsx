import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminMetricsDashboard } from '@/features/admin-metrics/front/components/AdminMetricsDashboard'

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

describe('AdminMetricsDashboard', () => {
  beforeEach(() => {
    mockGetSummary.mockResolvedValue(summary)
    mockGetUsers.mockResolvedValue({
      rows: [
        {
          userId: 'u1',
          userEmail: 'a@test.com',
          workspaceId: 'hh1',
          workspaceName: 'Family A',
          isActiveInPeriod: true,
          lastActiveAt: '2026-05-20T10:00:00Z',
          learnerCount: 2,
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
        },
      ],
      total: 1,
      page: 1,
      pageSize: 50,
    })
  })

  it('renders hero cards and table', async () => {
    render(<AdminMetricsDashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-metrics-hero')).toBeInTheDocument()
    })
    expect(screen.getByTestId('hero-active-users')).toHaveTextContent('3 users')
    expect(screen.getByTestId('admin-metrics-table')).toBeInTheDocument()
    expect(screen.getByText('a@test.com')).toBeInTheDocument()
  })

  it('shows forbidden state on 403', async () => {
    mockGetSummary.mockRejectedValue(Object.assign(new Error('Forbidden'), { status: 403 }))
    render(<AdminMetricsDashboard />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-metrics-forbidden')).toBeInTheDocument()
    })
  })
})

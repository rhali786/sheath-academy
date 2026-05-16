import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ReportsPage } from '@/features/reports/front/pages/ReportsPage'
import { DashboardContext, type DashboardContextType } from '@/features/dashboard/front/context'
import type { RecordsReport } from '@/features/reports/types'

jest.mock('@/features/reports/front/services/api', () => ({
  reportsApi: {
    getRecordsReport: jest.fn(),
  },
}))

import { reportsApi } from '@/features/reports/front/services/api'

const mockReportsApi = reportsApi as jest.Mocked<typeof reportsApi>

const child = {
  id: 'child_a',
  householdId: 'household_1',
  name: 'Adam',
  gradeLabel: 'Grade 5',
  username: 'adam',
  password: 'password',
  isActive: true,
  createdAt: '2026-01-01T00:00:00Z',
}

const report: RecordsReport = {
  child,
  dateRange: { start: '2025-08-01', end: '2026-05-31' },
  subjects: [
    {
      id: 'sub_a',
      childId: 'child_a',
      name: 'Mathematics',
      category: 'Math',
      isActive: true,
      order: 1,
      createdAt: '2026-01-01T00:00:00Z',
    },
  ],
  attendance: {
    childId: 'child_a',
    totalPresent: 4,
    totalAbsent: 1,
    totalPartial: 0,
    totalRecorded: 5,
  },
  completedLessons: [],
  progressBySubject: [
    {
      childId: 'child_a',
      childName: 'Adam',
      subjectId: 'sub_a',
      subjectName: 'Mathematics',
      scope: 'year',
      plannedCount: 5,
      completedCount: 3,
      pendingCount: 2,
      completionRate: 0.6,
    },
  ],
  portfolio: {
    count: 1,
    items: [
      {
        id: 'ev_1',
        title: 'Long division link',
        childId: 'child_a',
        subjectId: 'sub_a',
        date: '2026-05-12',
        type: 'link',
        notes: 'Helpful lesson',
        reflection: 'This shows steady growth.',
        url: 'https://example.com',
        createdBy: 'parent',
        createdAt: '2026-05-12T00:00:00Z',
        updatedAt: '2026-05-12T00:00:00Z',
      },
    ],
  },
  checklist: [
    {
      id: 'missing_attendance_records',
      label: 'Missing attendance records',
      detail: 'Some weekdays are missing attendance.',
      severity: 'warning',
      blocking: false,
    },
  ],
  generatedAt: '2026-05-16T00:00:00Z',
}

function contextValue(overrides: Partial<DashboardContextType> = {}): DashboardContextType {
  return {
    children: [child],
    tasks: [],
    setTasks: jest.fn(),
    alerts: [],
    setAlerts: jest.fn(),
    quranSessions: [],
    setQuranSessions: jest.fn(),
    records: [],
    setRecords: jest.fn(),
    metrics: null,
    setMetrics: jest.fn(),
    toggleTask: jest.fn(),
    addQuranSession: jest.fn(),
    loading: false,
    error: null,
    selectedChildId: 'child_a',
    setSelectedChildId: jest.fn(),
    ...overrides,
  }
}

function renderReportsPage(value = contextValue()) {
  return render(
    <DashboardContext.Provider value={value}>
      <ReportsPage />
    </DashboardContext.Provider>
  )
}

describe('ReportsPage', () => {
  beforeEach(() => {
    mockReportsApi.getRecordsReport.mockResolvedValue({
      status: 'success',
      data: report,
      message: '',
      timestamp: '',
    })
  })

  it('renders a records summary report for the selected child', async () => {
    renderReportsPage()

    await waitFor(() => {
      expect(screen.getByText('Records summary')).toBeInTheDocument()
    })

    expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Mathematics').length).toBeGreaterThan(0)
    expect(screen.getByText('Portfolio evidence')).toBeInTheDocument()
    expect(screen.getByText('This shows steady growth.')).toBeInTheDocument()
    expect(screen.getByText('Missing attendance records')).toBeInTheDocument()
  })

  it('prints through browser print without blocking on checklist items', async () => {
    const print = jest.fn()
    Object.defineProperty(window, 'print', { value: print, writable: true })

    renderReportsPage()

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print records/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /print records/i }))

    expect(print).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state when there are no children to report on', () => {
    renderReportsPage(contextValue({ children: [], selectedChildId: null }))

    expect(screen.getByText(/add a child before generating reports/i)).toBeInTheDocument()
  })
})

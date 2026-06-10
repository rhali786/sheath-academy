import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ReportsPage } from '@/features/records/front/pages/ReportsPage'
import type { RecordsReport } from '@/features/records/types'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    householdProfile: { id: 'hh_001', workspaceId: 'hh_001', familyName: 'Test', createdAt: '2026-01-01T00:00:00.000Z' },
    studentProfiles: [],
    allSubjects: [],
    loading: false,
    needsSetup: false,
    familyName: 'Test',
    error: null,
    refetch: jest.fn(),
  })),
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getChildren: jest.fn(() =>
      Promise.resolve({
        data: [
          {
            id: 'child_a',
            householdId: 'hh_001',
            name: 'Adam',
            gradeLabel: 'Grade 5',
            username: 'adam',
            password: 'password',
            isActive: true,
            avatarInitials: 'A',
            createdAt: '2026-01-01T00:00:00Z',
          },
        ],
        status: 'success',
        message: '',
        timestamp: '',
      })
    ),
  },
}))

jest.mock('@/features/records/front/services/api', () => ({
  reportsApi: {
    getRecordsReport: jest.fn(),
  },
}))

import { reportsApi } from '@/features/records/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'

const mockReportsApi = reportsApi as jest.Mocked<typeof reportsApi>
const mockChildrenApi = childrenApi as jest.Mocked<typeof childrenApi>

const report: RecordsReport = {
  child: {
    id: 'child_a',
    householdId: 'hh_001',
    name: 'Adam',
    gradeLabel: 'Grade 5',
    username: 'adam',
    password: 'password',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
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
    totalRecorded: 5,
    byStatus: {
      present: 4,
      absent: 1,
      partial: 0,
      excused: 0,
      sick: 0,
      holiday: 0,
      field_trip: 0,
      coop: 0,
      makeup: 0,
      not_school: 0,
    },
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

describe('ReportsPage', () => {
  beforeEach(() => {
    mockReportsApi.getRecordsReport.mockResolvedValue({
      status: 'success',
      data: report,
      message: '',
      timestamp: '',
    })
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders a records summary report for the selected child', async () => {
    render(<ReportsPage />)

    await waitFor(() => {
      expect(screen.getAllByText('Mathematics').length).toBeGreaterThan(0)
    }, { timeout: 3000 })

    expect(screen.getAllByText('Records summary').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
    expect(screen.getByText('Portfolio evidence')).toBeInTheDocument()
    expect(screen.getByText('This shows steady growth.')).toBeInTheDocument()
    expect(screen.getByText('Missing attendance records')).toBeInTheDocument()
  })

  it('prints through browser print without blocking on checklist items', async () => {
    const print = jest.fn()
    Object.defineProperty(window, 'print', { value: print, writable: true })

    render(<ReportsPage />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print records/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /print records/i }))

    expect(print).toHaveBeenCalledTimes(1)
  })

  it('shows an empty state when there are no children to report on', async () => {
    mockChildrenApi.getChildren.mockResolvedValueOnce({
      data: [],
      status: 'success',
      message: '',
      timestamp: '',
    })

    render(<ReportsPage />)

    await waitFor(() => {
      expect(screen.getByText(/add a child before generating reports/i)).toBeInTheDocument()
    })
  })
})

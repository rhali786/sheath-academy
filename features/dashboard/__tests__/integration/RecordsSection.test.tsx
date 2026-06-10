import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RecordsProof } from '@/features/dashboard/front/components/RecordsProof'
import type { RecordsReport } from '@/features/records/types'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({
    studentProfiles: [
      {
        id: 'child_001',
        householdId: 'hh_001',
        name: 'Adam',
        gradeLabel: 'Grade 5',
        username: 'adam',
        password: 'pw',
        isActive: true,
        createdAt: '2026-01-01T00:00:00Z',
      },
    ],
  })),
}))

jest.mock('@/features/records/front/services/api', () => ({
  reportsApi: {
    getRecordsReport: jest.fn(),
  },
}))

jest.mock('@/features/quran/front/services/api', () => ({
  quranApi: {
    getSessions: jest.fn(),
  },
}))

import { reportsApi } from '@/features/records/front/services/api'
import { quranApi } from '@/features/quran/front/services/api'

const mockGetRecordsReport = reportsApi.getRecordsReport as jest.Mock
const mockGetSessions = quranApi.getSessions as jest.Mock

const mockRecords = [
  { id: 'record_attendance', title: 'Attendance', count: 10, icon: 'CheckCircle', viewButton: 'View records' },
]

const report: RecordsReport = {
  child: {
    id: 'child_001',
    householdId: 'hh_001',
    name: 'Adam',
    gradeLabel: 'Grade 5',
    username: 'adam',
    password: 'pw',
    isActive: true,
    createdAt: '2026-01-01T00:00:00Z',
  },
  dateRange: { start: '2025-08-01', end: '2026-05-31' },
  subjects: [],
  attendance: {
    childId: 'child_001',
    totalRecorded: 5,
    byStatus: {
      present: 5,
      absent: 0,
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
  progressBySubject: [],
  portfolio: { count: 0, items: [] },
  checklist: [],
  generatedAt: '2026-05-16T00:00:00Z',
}

describe('RecordsProof — dashboard exports', () => {
  beforeEach(() => {
    window.print = jest.fn()
    mockGetRecordsReport.mockResolvedValue({
      status: 'success',
      data: report,
      message: '',
      timestamp: '',
    })
    mockGetSessions.mockResolvedValue({
      status: 'success',
      data: { sessions: [], chartData: [] },
      message: '',
      timestamp: '',
    })
  })

  afterEach(() => {
    document.body.classList.remove('dashboard-printing')
    jest.clearAllMocks()
  })

  it('clicking Attendance Report does not show "being prepared" text', async () => {
    render(<RecordsProof records={mockRecords} selectedChildId="child_001" />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))

    expect(screen.queryByText(/being prepared/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/check your downloads/i)).not.toBeInTheDocument()
  })

  it('loads report data and shows a print-ready preview', async () => {
    render(<RecordsProof records={mockRecords} selectedChildId="child_001" />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))

    await waitFor(() => {
      expect(mockGetRecordsReport).toHaveBeenCalledWith({ childId: 'child_001' })
    })

    expect(screen.getByRole('heading', { name: /print attendance report/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /print report/i })).toBeInTheDocument()
  })

  it('clicking Print report calls window.print()', async () => {
    render(<RecordsProof records={mockRecords} selectedChildId="child_001" />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print report/i })).not.toBeDisabled()
    })

    fireEvent.click(screen.getByRole('button', { name: /print report/i }))

    expect(window.print).toHaveBeenCalledTimes(1)
    expect(document.body.classList.contains('dashboard-printing')).toBe(true)
  })

  it('modal has a Close button that dismisses the modal', async () => {
    render(<RecordsProof records={mockRecords} selectedChildId="child_001" />)

    fireEvent.click(screen.getByRole('button', { name: /attendance report/i }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /print report/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /close/i }))
    expect(screen.queryByRole('button', { name: /print report/i })).not.toBeInTheDocument()
  })

  it('fetches quran sessions for Quran Summary export', async () => {
    render(<RecordsProof records={mockRecords} selectedChildId="child_001" />)

    fireEvent.click(screen.getByRole('button', { name: /quran summary/i }))

    await waitFor(() => {
      expect(mockGetSessions).toHaveBeenCalledWith('child_001')
    })
  })
})

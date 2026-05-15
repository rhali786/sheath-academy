import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AttendancePage } from '@/features/attendance/front/pages/AttendancePage'
import type { AttendanceRecord } from '@/features/attendance/types'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
}))

jest.mock('@/features/attendance/front/services/api', () => ({
  attendanceApi: {
    getRecords: jest.fn(),
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    deleteRecord: jest.fn(),
    getSummary: jest.fn(),
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(),
  },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(() => ({ householdProfile: { id: 'hh_001' } })),
}))

import { attendanceApi } from '@/features/attendance/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'

const mockGetRecords = attendanceApi.getRecords as jest.Mock
const mockCreateRecord = attendanceApi.createRecord as jest.Mock
const mockGetSummary = attendanceApi.getSummary as jest.Mock
const mockGetAllChildren = (childrenApi as any).getAllChildren as jest.Mock

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'khadijah', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]

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

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: '', timestamp: '' }
}

beforeEach(() => {
  mockGetAllChildren.mockResolvedValue(ok(mockChildren))
  mockGetRecords.mockResolvedValue(ok([]))
  mockCreateRecord.mockResolvedValue(ok(makeRecord()))
  mockGetSummary.mockResolvedValue(ok({ childId: 'child_001', totalPresent: 0, totalAbsent: 0, totalPartial: 0, totalRecorded: 0 }))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('AttendancePage', () => {
  it('renders the page heading', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /attendance/i })).toBeInTheDocument()
    })
  })

  it('renders a child selector with loaded children', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByRole('combobox')).toBeInTheDocument()
    })
    expect(screen.getByText('Adam')).toBeInTheDocument()
  })

  it('renders Present, Absent, Partial quick-mark buttons', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /present/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /absent/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /partial/i })).toBeInTheDocument()
    })
  })

  it('shows attendance records after load', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ status: 'present', date: '2026-05-12' })]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText('present')).toBeInTheDocument()
    })
  })

  it('shows summary counts', async () => {
    mockGetSummary.mockResolvedValue(ok({ childId: 'child_001', totalPresent: 3, totalAbsent: 1, totalPartial: 0, totalRecorded: 4 }))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
    })
  })

  it('clicking Present button calls createRecord with status present', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /present/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /present/i }))
    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'present' })
      )
    })
  })

  it('shows empty state when no records', async () => {
    mockGetRecords.mockResolvedValue(ok([]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText(/no attendance records/i)).toBeInTheDocument()
    })
  })
})

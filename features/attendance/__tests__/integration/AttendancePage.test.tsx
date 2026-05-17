import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { AttendancePage } from '@/features/attendance/front/pages/AttendancePage'
import type { AttendanceRecord } from '@/features/attendance/types'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'

let mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/features/attendance/front/services/api', () => ({
  attendanceApi: {
    getRecords: jest.fn(),
    createRecord: jest.fn(),
    updateRecord: jest.fn(),
    archiveRecord: jest.fn(),
    batchRecord: jest.fn(),
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
const mockArchiveRecord = attendanceApi.archiveRecord as jest.Mock
const mockBatchRecord = attendanceApi.batchRecord as jest.Mock
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

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

beforeEach(() => {
  mockSearchParams = new URLSearchParams()
  mockGetAllChildren.mockResolvedValue(ok(mockChildren))
  mockGetRecords.mockResolvedValue(ok([]))
  mockCreateRecord.mockResolvedValue(ok(makeRecord()))
  mockArchiveRecord.mockResolvedValue(ok(null))
  mockBatchRecord.mockResolvedValue(ok([]))
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

  it('renders a learner selector with loaded children', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getAllByRole('combobox').length).toBeGreaterThan(0)
    })
    expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
  })

  it('renders Present, Absent, Partial quick-mark buttons', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^present$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^absent$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^partial$/i })).toBeInTheDocument()
    })
  })

  it('shows attendance records after load', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ status: 'present', date: '2026-05-12' })]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getAllByText('Present').length).toBeGreaterThan(0)
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
      expect(screen.getByRole('button', { name: /^present$/i })).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /^present$/i }))
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

  it('shows child name in each attendance record row', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ childId: 'child_001', status: 'present' })]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
    })
  })

  it('shows hours when hours > 0', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ hours: 2, minutes: 30 })]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByText(/2h/)).toBeInTheDocument()
      expect(screen.getByText(/30m/)).toBeInTheDocument()
    })
  })

  it('does not show time when hours and minutes are both 0', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ hours: 0, minutes: 0 })]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.queryByText(/0h/)).not.toBeInTheDocument()
    })
  })

  it('shows notes icon when notes are present', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ notes: 'Worked on fractions' })]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Has notes' })).toBeInTheDocument()
    })
  })

  it('does not show notes icon when notes are absent', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ notes: undefined })]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Has notes' })).not.toBeInTheDocument()
    })
  })

  // FB-014 TDD tests

  it('date field defaults to today', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      const dateInput = screen.getByLabelText(/^date$/i) as HTMLInputElement
      expect(dateInput.value).toBe(todayLocal())
    })
  })

  it('renders all active learners in batch mode', async () => {
    render(<AttendancePage />)
    // Wait for children to load (Adam appears in the learner dropdown)
    await waitFor(() => expect(screen.getAllByText('Adam').length).toBeGreaterThan(0))
    fireEvent.click(screen.getByRole('button', { name: /batch mode/i }))
    await waitFor(() => {
      expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Khadijah').length).toBeGreaterThan(0)
    })
    // In batch mode, each learner has a status dropdown labeled "Status for <name>"
    expect(screen.getByLabelText('Status for Adam')).toBeInTheDocument()
    expect(screen.getByLabelText('Status for Khadijah')).toBeInTheDocument()
  })

  it('clicking Mark all present sets all learner statuses to present', async () => {
    render(<AttendancePage />)
    await waitFor(() => expect(screen.getAllByText('Adam').length).toBeGreaterThan(0))
    fireEvent.click(screen.getByRole('button', { name: /batch mode/i }))
    await waitFor(() => screen.getByRole('button', { name: /mark all present/i }))
    fireEvent.click(screen.getByRole('button', { name: /mark all present/i }))
    const statusSelects = screen.getAllByRole('combobox').filter(
      el => el.getAttribute('aria-label')?.startsWith('Status for')
    ) as HTMLSelectElement[]
    expect(statusSelects.length).toBeGreaterThan(0)
    statusSelects.forEach(sel => {
      expect(sel.value).toBe('present')
    })
  })

  it('status dropdown includes Field trip and Co-op day options in batch mode', async () => {
    render(<AttendancePage />)
    await waitFor(() => expect(screen.getAllByText('Adam').length).toBeGreaterThan(0))
    fireEvent.click(screen.getByRole('button', { name: /batch mode/i }))
    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options.some(o => o.textContent === 'Field trip')).toBe(true)
      expect(options.some(o => o.textContent === 'Co-op day')).toBe(true)
    })
  })

  it('Void button shows confirm dialog and archives the record', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true)
    mockGetRecords.mockResolvedValue(ok([makeRecord({ id: 'rec_001', status: 'present' })]))
    render(<AttendancePage />)
    await waitFor(() => screen.getByRole('button', { name: /void/i }))
    fireEvent.click(screen.getByRole('button', { name: /void/i }))
    expect(confirmSpy).toHaveBeenCalled()
    await waitFor(() => {
      expect(mockArchiveRecord).toHaveBeenCalledWith('rec_001')
    })
    confirmSpy.mockRestore()
  })

  it('Void button does not archive when confirm is cancelled', async () => {
    const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false)
    mockGetRecords.mockResolvedValue(ok([makeRecord({ id: 'rec_001', status: 'present' })]))
    render(<AttendancePage />)
    await waitFor(() => screen.getByRole('button', { name: /void/i }))
    fireEvent.click(screen.getByRole('button', { name: /void/i }))
    expect(confirmSpy).toHaveBeenCalled()
    expect(mockArchiveRecord).not.toHaveBeenCalled()
    confirmSpy.mockRestore()
  })

  it('filter by learner shows only that learner records', async () => {
    mockGetRecords.mockResolvedValue(ok([
      makeRecord({ id: 'rec_001', childId: 'child_001', status: 'present', date: '2026-05-12' }),
      makeRecord({ id: 'rec_002', childId: 'child_002', status: 'absent', date: '2026-05-13' }),
    ]))
    render(<AttendancePage />)
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /void/i })).toHaveLength(2)
    })
    fireEvent.change(screen.getByLabelText(/filter by learner/i), { target: { value: 'child_002' } })
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /void/i })).toHaveLength(1)
    })
  })

  it('selects the child from ?childId query param after children load', async () => {
    mockSearchParams = new URLSearchParams('childId=child_002')
    mockGetSummary.mockResolvedValue(ok({ childId: 'child_002', totalPresent: 0, totalAbsent: 0, totalPartial: 0, totalRecorded: 0 }))
    render(<AttendancePage />)
    await waitFor(() => {
      const selector = screen.getAllByRole('combobox')[0]
      expect(selector).toHaveValue('child_002')
    })
  })

  it('falls back to first child when ?childId is invalid', async () => {
    mockSearchParams = new URLSearchParams('childId=invalid_id')
    render(<AttendancePage />)
    await waitFor(() => {
      const selector = screen.getAllByRole('combobox')[0]
      expect(selector).toHaveValue('child_001')
    })
  })

  it('uses first child when no ?childId param', async () => {
    render(<AttendancePage />)
    await waitFor(() => {
      const selector = screen.getAllByRole('combobox')[0]
      expect(selector).toHaveValue('child_001')
    })
  })
})

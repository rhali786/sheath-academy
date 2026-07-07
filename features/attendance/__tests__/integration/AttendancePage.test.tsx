import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { AttendancePage } from '@/features/attendance/front/pages/AttendancePage'
import { LearnerProvider } from '@/features/layout/front/context/LearnerContext'
import type { AttendanceRecord } from '@/features/attendance/types'
import { emptyAttendanceStatusCounts } from '@/features/attendance/types'
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

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

import { attendanceApi } from '@/features/attendance/front/services/api'
import { useHousehold } from '@/features/household/front/context'

const mockGetRecords = attendanceApi.getRecords as jest.Mock
const mockCreateRecord = attendanceApi.createRecord as jest.Mock
const mockUpdateRecord = attendanceApi.updateRecord as jest.Mock
const mockArchiveRecord = attendanceApi.archiveRecord as jest.Mock
const mockBatchRecord = attendanceApi.batchRecord as jest.Mock
const mockGetSummary = attendanceApi.getSummary as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock

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

async function openMarkForm() {
  fireEvent.click(screen.getByRole('button', { name: /mark attendance/i }))
  await waitFor(() => {
    expect(screen.getByLabelText(/^date$/i)).toBeInTheDocument()
  })
}

function renderAttendance() {
  return render(
    <LearnerProvider>
      <AttendancePage />
    </LearnerProvider>,
  )
}

beforeEach(() => {
  mockSearchParams = new URLSearchParams()
  mockUseHousehold.mockImplementation(() => ({
    householdProfile: { id: 'hh_001' },
    studentProfiles: mockChildren,
    allSubjects: [],
    loading: false,
    needsSetup: false,
    familyName: '',
    error: null,
    refetch: jest.fn(),
  }))
  mockGetRecords.mockResolvedValue(ok([]))
  mockCreateRecord.mockResolvedValue(ok(makeRecord()))
  mockUpdateRecord.mockResolvedValue(ok(makeRecord()))
  mockArchiveRecord.mockResolvedValue(ok(null))
  mockBatchRecord.mockResolvedValue(ok([]))
  mockGetSummary.mockResolvedValue(ok({
    childId: 'child_001',
    totalRecorded: 0,
    byStatus: emptyAttendanceStatusCounts(),
  }))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('AttendancePage', () => {
  it('renders the page heading', async () => {
    renderAttendance()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /^attendance$/i, level: 1 })).toBeInTheDocument()
    })
  })

  it('renders a learner selector with loaded children when form is open', async () => {
    renderAttendance()
    await openMarkForm()
    await waitFor(() => {
      expect(screen.getByLabelText(/^learner$/i)).toBeInTheDocument()
    })
    expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
  })

  it('renders all attendance status quick-mark buttons when form is open', async () => {
    renderAttendance()
    await openMarkForm()
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /^present$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^absent$/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /^partial$/i })).toBeInTheDocument()
      expect(screen.getByTestId('attendance-status-excused')).toBeInTheDocument()
      expect(screen.getByTestId('attendance-status-sick')).toBeInTheDocument()
    })
  })

  it('shows attendance records after load', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ status: 'present', date: '2026-05-12' })]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.getAllByText('Present').length).toBeGreaterThan(0)
    })
  })

  it('shows summary counts', async () => {
    const byStatus = emptyAttendanceStatusCounts()
    byStatus.present = 3
    byStatus.absent = 1
    mockGetSummary.mockResolvedValue(ok({ childId: 'child_001', totalRecorded: 4, byStatus }))
    renderAttendance()
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument()
      expect(screen.getByTestId('attendance-summary-present')).toBeInTheDocument()
      expect(screen.getByTestId('attendance-summary-absent')).toBeInTheDocument()
    })
  })

  it('clicking Present button calls createRecord with status present', async () => {
    renderAttendance()
    await openMarkForm()
    await waitFor(() => {
      expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
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
    renderAttendance()
    await waitFor(() => {
      expect(screen.getByText(/no attendance records/i)).toBeInTheDocument()
    })
  })

  it('shows child name in each attendance record row', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ childId: 'child_001', status: 'present' })]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.getAllByText('Adam').length).toBeGreaterThan(0)
    })
  })

  it('shows hours when hours > 0', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ hours: 2, minutes: 30 })]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.getByText(/2h/)).toBeInTheDocument()
      expect(screen.getByText(/30m/)).toBeInTheDocument()
    })
  })

  it('does not show time when hours and minutes are both 0', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ hours: 0, minutes: 0 })]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.queryByText(/0h/)).not.toBeInTheDocument()
    })
  })

  it('shows notes icon when notes are present', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ notes: 'Worked on fractions' })]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.getByRole('img', { name: 'Has notes' })).toBeInTheDocument()
    })
  })

  it('does not show notes icon when notes are absent', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ notes: undefined })]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.queryByRole('img', { name: 'Has notes' })).not.toBeInTheDocument()
    })
  })

  // FB-014 TDD tests

  it('date field defaults to today when form is open', async () => {
    renderAttendance()
    await openMarkForm()
    const dateInput = screen.getByLabelText(/^date$/i) as HTMLInputElement
    expect(dateInput.value).toBe(todayLocal())
  })

  it('renders all active learners in batch mode', async () => {
    renderAttendance()
    await openMarkForm()
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
    renderAttendance()
    await openMarkForm()
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
    renderAttendance()
    await openMarkForm()
    await waitFor(() => expect(screen.getAllByText('Adam').length).toBeGreaterThan(0))
    fireEvent.click(screen.getByRole('button', { name: /batch mode/i }))
    await waitFor(() => {
      const options = screen.getAllByRole('option')
      expect(options.some(o => o.textContent === 'Field trip')).toBe(true)
      expect(options.some(o => o.textContent === 'Co-op day')).toBe(true)
    })
  })

  it('Void icon button shows inline confirm UI and archives the record on confirm', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ id: 'rec_001', status: 'present' })]))
    renderAttendance()
    await waitFor(() => screen.getByRole('button', { name: /void record/i }))
    fireEvent.click(screen.getByRole('button', { name: /void record/i }))
    // Inline confirm UI should appear (no window.confirm)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Void' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Void' }))
    await waitFor(() => {
      expect(mockArchiveRecord).toHaveBeenCalledWith('rec_001')
    })
  })

  it('Void icon button does not archive when inline cancel is clicked', async () => {
    mockGetRecords.mockResolvedValue(ok([makeRecord({ id: 'rec_001', status: 'present' })]))
    renderAttendance()
    await waitFor(() => screen.getByRole('button', { name: /void record/i }))
    fireEvent.click(screen.getByRole('button', { name: /void record/i }))
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(mockArchiveRecord).not.toHaveBeenCalled()
    // Void button should be back
    expect(screen.getByRole('button', { name: /void record/i })).toBeInTheDocument()
  })

  it('filter by learner shows only that learner records', async () => {
    mockGetRecords.mockResolvedValue(ok([
      makeRecord({ id: 'rec_001', childId: 'child_001', status: 'present', date: '2026-05-12' }),
      makeRecord({ id: 'rec_002', childId: 'child_002', status: 'absent', date: '2026-05-13' }),
    ]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /void record/i })).toHaveLength(2)
    })
    fireEvent.change(screen.getByLabelText(/filter by learner/i), { target: { value: 'child_002' } })
    await waitFor(() => {
      expect(screen.getAllByRole('button', { name: /void record/i })).toHaveLength(1)
    })
  })

  it('selects the child from ?childId query param after children load', async () => {
    mockSearchParams = new URLSearchParams('childId=child_002')
    mockGetSummary.mockResolvedValue(ok({ childId: 'child_002', totalRecorded: 0, byStatus: emptyAttendanceStatusCounts() }))
    renderAttendance()
    await openMarkForm()
    await waitFor(() => {
      const selector = screen.getByLabelText(/^learner$/i)
      expect(selector).toHaveValue('child_002')
    })
  })

  it('falls back to first child when ?childId is invalid', async () => {
    mockSearchParams = new URLSearchParams('childId=invalid_id')
    renderAttendance()
    await openMarkForm()
    await waitFor(() => {
      const selector = screen.getByLabelText(/^learner$/i)
      expect(selector).toHaveValue('child_001')
    })
  })

  it('uses first child when no ?childId param', async () => {
    renderAttendance()
    await openMarkForm()
    await waitFor(() => {
      const selector = screen.getByLabelText(/^learner$/i)
      expect(selector).toHaveValue('child_001')
    })
  })

  it('summary heading shows selected learner name', async () => {
    renderAttendance()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /summary — adam/i })).toBeInTheDocument()
    })
  })

  it('summary heading updates when learner selector changes', async () => {
    renderAttendance()
    await openMarkForm()
    await waitFor(() => {
      const sel = screen.getByLabelText(/^learner$/i) as HTMLSelectElement
      expect(sel).toHaveValue('child_001')
    })
    mockGetSummary.mockResolvedValue(ok({ childId: 'child_002', totalRecorded: 0, byStatus: emptyAttendanceStatusCounts() }))
    fireEvent.change(screen.getByLabelText(/^learner$/i), { target: { value: 'child_002' } })
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /summary — khadijah/i })).toBeInTheDocument()
    })
  })

  it('summary heading still names the learner when attendance is empty', async () => {
    mockGetRecords.mockResolvedValue(ok([]))
    renderAttendance()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /summary — adam/i })).toBeInTheDocument()
    })
  })

  it('updates selected learner when URL childId changes while component stays mounted', async () => {
    mockSearchParams = new URLSearchParams()
    const { rerender } = render(
      <LearnerProvider>
        <AttendancePage />
      </LearnerProvider>,
    )

    await openMarkForm()
    await waitFor(() => {
      const sel = screen.getByLabelText(/^learner$/i) as HTMLSelectElement
      expect(sel).toHaveValue('child_001')
    })

    act(() => { mockSearchParams = new URLSearchParams('childId=child_002') })
    rerender(
      <LearnerProvider>
        <AttendancePage />
      </LearnerProvider>,
    )

    await waitFor(() => {
      const sel = screen.getByLabelText(/^learner$/i) as HTMLSelectElement
      expect(sel).toHaveValue('child_002')
    })
  })
})

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { WeekAttendanceCard } from '@/features/dashboard/front/components/WeekAttendanceCard'
import type { AttendanceSummary } from '@/features/attendance/types'

jest.mock('@/features/attendance/front/services/api', () => ({
  attendanceApi: {
    getSummary: jest.fn(),
  },
}))

import { attendanceApi } from '@/features/attendance/front/services/api'
const mockGetSummary = attendanceApi.getSummary as jest.Mock

const mockSummary: AttendanceSummary = {
  childId: 'child_a',
  totalPresent: 3,
  totalAbsent: 1,
  totalPartial: 1,
  totalRecorded: 5,
}

describe('WeekAttendanceCard', () => {
  beforeEach(() => jest.clearAllMocks())

  it('shows loading state initially', () => {
    mockGetSummary.mockReturnValue(new Promise(() => {}))
    render(<WeekAttendanceCard childId="child_a" />)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })

  it('renders attendance counts after loading', async () => {
    mockGetSummary.mockResolvedValue({ data: mockSummary })
    render(<WeekAttendanceCard childId="child_a" />)
    await waitFor(() => {
      expect(screen.getByText('3')).toBeInTheDocument() // present
      expect(screen.getAllByText('1')).toHaveLength(2)   // absent=1 and partial=1
    })
  })

  it('shows empty state when no records for this week', async () => {
    mockGetSummary.mockResolvedValue({
      data: { childId: 'child_a', totalPresent: 0, totalAbsent: 0, totalPartial: 0, totalRecorded: 0 },
    })
    render(<WeekAttendanceCard childId="child_a" />)
    await waitFor(() => {
      expect(screen.getByText(/no attendance/i)).toBeInTheDocument()
    })
  })

  it('shows error state gracefully when fetch fails', async () => {
    mockGetSummary.mockRejectedValue(new Error('fail'))
    render(<WeekAttendanceCard childId="child_a" />)
    await waitFor(() => {
      expect(screen.getByText(/unavailable/i)).toBeInTheDocument()
    })
  })

  it('does not render when childId is not provided', () => {
    const { container } = render(<WeekAttendanceCard childId={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('passes week range to getSummary', async () => {
    mockGetSummary.mockResolvedValue({ data: mockSummary })
    render(<WeekAttendanceCard childId="child_a" />)
    await waitFor(() => {
      expect(mockGetSummary).toHaveBeenCalledWith(
        'child_a',
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
      )
    })
  })
})

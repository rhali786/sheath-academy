import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { SchedulePage } from '@/features/schedule/front/pages/SchedulePage'
import type { StudentProfile } from '@/features/lib/types'

const mockUseSearchParams = jest.fn(() => new URLSearchParams('date=2026-06-01&view=day'))
jest.mock('next/navigation', () => ({
  useSearchParams: () => mockUseSearchParams(),
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: jest.fn().mockResolvedValue([]) },
}))

jest.mock('@/features/attendance/front/services/api', () => ({
  attendanceApi: {
    createRecord: jest.fn().mockResolvedValue({ status: 'success', data: {}, message: '', timestamp: '' }),
  },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/schedule/front/components/CalendarNav', () => ({
  CalendarNav: () => <div data-testid="calendar-nav" />,
}))

jest.mock('@/features/schedule/front/components/WeekCalendarView', () => ({
  WeekCalendarView: () => null,
}))

jest.mock('@/features/schedule/front/components/MonthCalendarView', () => ({
  MonthCalendarView: () => null,
}))

jest.mock('@/features/schedule/front/components/ScheduleTimeline', () => ({
  ScheduleTimeline: () => <div data-testid="schedule-timeline" />,
}))

import { attendanceApi } from '@/features/attendance/front/services/api'
import { useHousehold } from '@/features/household/front/context'

const mockCreateRecord = attendanceApi.createRecord as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock

const mockChild: StudentProfile = {
  id: 'child_001',
  householdId: 'hh_001',
  name: 'Adam',
  gradeLabel: '5th',
  isActive: true,
  username: 'adam',
  password: 'pw',
  createdAt: '2026-01-01T00:00:00Z',
}

beforeEach(() => {
  sessionStorage.clear()
  mockCreateRecord.mockClear()
  mockUseHousehold.mockImplementation(() => ({
    householdProfile: { id: 'hh_001', weekStartDay: 'Monday' },
    studentProfiles: [mockChild],
    allSubjects: [],
    loading: false,
  }))
})

describe('SchedulePage attendance capture (day view)', () => {
  test('shows collapsible Mark attendance block on day view', async () => {
    render(<SchedulePage />)
    await waitFor(() => {
      expect(screen.getByTestId('schedule-attendance-capture')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('attendance-status-present')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /mark attendance/i }))
    expect(screen.getByTestId('attendance-status-present')).toBeInTheDocument()
  })

  test('selecting a status calls attendanceApi.createRecord for the day date and focused learner', async () => {
    sessionStorage.setItem('sheath.selectedChildId', 'child_001')
    render(<SchedulePage />)
    await waitFor(() => {
      expect(screen.getByTestId('schedule-attendance-capture')).toBeInTheDocument()
    })
    fireEvent.click(screen.getByRole('button', { name: /mark attendance/i }))
    fireEvent.click(screen.getByTestId('attendance-status-present'))
    await waitFor(() => {
      expect(mockCreateRecord).toHaveBeenCalledWith({
        childId: 'child_001',
        householdId: 'hh_001',
        date: '2026-06-01',
        status: 'present',
      })
    })
  })

  test('does not show attendance capture on week view', async () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-06-01&view=week'))
    render(<SchedulePage />)
    await waitFor(() => {
      expect(screen.getByTestId('calendar-nav')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('schedule-attendance-capture')).not.toBeInTheDocument()
    mockUseSearchParams.mockReturnValue(new URLSearchParams('date=2026-06-01&view=day'))
  })
})

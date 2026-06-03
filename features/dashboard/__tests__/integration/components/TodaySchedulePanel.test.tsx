import { render, screen } from '@testing-library/react'
import { TodaySchedulePanel } from '@/features/dashboard/front/components/TodaySchedulePanel'
import type { DaySchedule } from '@/features/schedule/types'

jest.mock('@/features/schedule/front/components/ScheduleTimeline', () => ({
  ScheduleTimeline: () => <div data-testid="schedule-timeline" />,
}))

const schedule: DaySchedule = {
  date: '2026-05-24',
  blocks: [],
  entries: [],
  isPaused: false,
}

describe('TodaySchedulePanel', () => {
  test('renders schedule panel with calendar link and timeline', () => {
    render(<TodaySchedulePanel schedule={schedule} currentTime="10:00" />)
    expect(screen.getByTestId('today-schedule-panel')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view full calendar/i })).toHaveAttribute('href', '/plan/schedule?date=2026-05-24')
    expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
  })

  test('shows footer counts', () => {
    render(<TodaySchedulePanel schedule={schedule} currentTime="10:00" />)
    expect(screen.getByTestId('schedule-footer-counts')).toHaveTextContent('0 of 0')
  })
})

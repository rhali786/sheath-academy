import { render, screen } from '@testing-library/react'
import { TodaySchedulePanel } from '@/features/dashboard/front/components/TodaySchedulePanel'
import type { DaySchedule } from '@/features/schedule/types'

jest.mock('@/features/schedule/front/components/ScheduleNowNextCard', () => ({
  ScheduleNowNextCard: () => <div data-testid="schedule-now-next-card" />,
}))

const schedule: DaySchedule = {
  date: '2026-05-24',
  blocks: [],
  isPaused: false,
}

describe('TodaySchedulePanel', () => {
  test('renders schedule panel with calendar link', () => {
    render(<TodaySchedulePanel schedule={schedule} currentTime="10:00" />)
    expect(screen.getByTestId('today-schedule-panel')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /view full calendar/i })).toHaveAttribute('href', '/plan/schedule')
    expect(screen.getByTestId('schedule-now-next-card')).toBeInTheDocument()
  })
})

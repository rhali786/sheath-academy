import { render, screen } from '@testing-library/react'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'
import type { LessonTask } from '@/features/plan/types'

function makeLesson(id: string, title: string, status: LessonTask['status'] = 'not_started'): LessonTask {
  return {
    id,
    childId: 'c1',
    subjectId: 's1',
    householdId: 'h1',
    title,
    dueDate: '2026-05-24',
    status,
    order: 1,
    estimatedDuration: '30min',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

describe('ScheduleTimeline', () => {
  test('shows empty state when no entries', () => {
    const schedule = buildDailySchedule([], { startTime: '08:30', transitionMinutes: 10 })
    render(<ScheduleTimeline schedule={schedule} currentTime="09:00" showAdjustDay={false} />)
    expect(screen.getByTestId('schedule-timeline-empty')).toBeInTheDocument()
  })

  test('renders lesson rows with status pills', () => {
    const schedule = buildDailySchedule(
      [makeLesson('l1', 'Mathematics', 'completed'), makeLesson('l2', 'Science', 'not_started')],
      { startTime: '08:30', transitionMinutes: 10, includeSyntheticBreaks: true },
    )
    render(<ScheduleTimeline schedule={schedule} currentTime="09:00" showAdjustDay={false} />)
    expect(screen.getByTestId('schedule-timeline')).toBeInTheDocument()
    expect(screen.getByText('Mathematics')).toBeInTheDocument()
    expect(screen.getByTestId('timeline-status-completed')).toBeInTheDocument()
  })
})

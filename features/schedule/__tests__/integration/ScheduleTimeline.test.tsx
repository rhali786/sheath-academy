import { render, screen, fireEvent } from '@testing-library/react'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'
import type { LessonTask } from '@/features/plan/types'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

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

beforeEach(() => {
  mockPush.mockReset()
})

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

  test('lesson row renders edit icon button', () => {
    const schedule = buildDailySchedule(
      [makeLesson('l1', 'Mathematics', 'not_started')],
      { startTime: '08:30', transitionMinutes: 10 },
    )
    render(<ScheduleTimeline schedule={schedule} currentTime="09:00" showAdjustDay={false} onEditLesson={jest.fn()} />)
    expect(screen.getByRole('button', { name: /edit lesson/i })).toBeInTheDocument()
  })

  // UAT 8.2 (2026-10-12): every screen edits in place now. The old fallback sent the parent
  // to /lessons?editId=, a page no screen links to any more — so without a handler, no pencil.
  test('without an edit handler there is no pencil and nothing navigates to /lessons?editId=', () => {
    const schedule = buildDailySchedule(
      [makeLesson('l1', 'Mathematics', 'not_started')],
      { startTime: '08:30', transitionMinutes: 10 },
    )
    render(<ScheduleTimeline schedule={schedule} currentTime="09:00" showAdjustDay={false} />)
    expect(screen.queryByRole('button', { name: /edit lesson/i })).not.toBeInTheDocument()
    expect(mockPush).not.toHaveBeenCalled()
  })

  test('an onEditLesson override is called instead of navigating', () => {
    const schedule = buildDailySchedule(
      [makeLesson('l1', 'Mathematics', 'not_started')],
      { startTime: '08:30', transitionMinutes: 10 },
    )
    const onEditLesson = jest.fn()
    render(<ScheduleTimeline schedule={schedule} currentTime="09:00" showAdjustDay={false} onEditLesson={onEditLesson} />)
    fireEvent.click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(onEditLesson).toHaveBeenCalledWith('l1')
    expect(mockPush).not.toHaveBeenCalled()
  })
})

// UAT 3.8 (reproduced on dev 2026-10-12): after the Dashboard's Edit lesson window saved a
// new time, the parent refetched and passed a new schedule, but the timeline kept drawing
// the one it was first given until a page reload.
describe('ScheduleTimeline — takes a new schedule from its parent', () => {
  function timed(id: string, title: string, start?: [string, string]): LessonTask {
    return { ...makeLesson(id, title), ...(start ? { scheduledStartTime: start[0], scheduledEndTime: start[1] } : {}) }
  }

  test('shows the new time when the parent passes an updated schedule', () => {
    const before = buildDailySchedule([timed('l1', 'Mathematics')], { startTime: '09:00', transitionMinutes: 10 })
    const { rerender } = render(<ScheduleTimeline schedule={before} currentTime="08:00" showAdjustDay={false} />)
    expect(screen.getByTestId('timeline-entry-block_l1')).toHaveTextContent('9:00 AM')

    const after = buildDailySchedule([timed('l1', 'Mathematics', ['13:00', '13:30'])], { startTime: '09:00', transitionMinutes: 10 })
    rerender(<ScheduleTimeline schedule={after} currentTime="08:00" showAdjustDay={false} />)
    expect(screen.getByTestId('timeline-entry-block_l1')).toHaveTextContent('1:00 PM')
  })

  test('shows a renamed lesson and drops a deleted one', () => {
    const before = buildDailySchedule([timed('l1', 'Mathematics'), timed('l2', 'Science')], { startTime: '09:00', transitionMinutes: 10 })
    const { rerender } = render(<ScheduleTimeline schedule={before} currentTime="08:00" showAdjustDay={false} />)
    const after = buildDailySchedule([timed('l1', 'Fractions review')], { startTime: '09:00', transitionMinutes: 10 })
    rerender(<ScheduleTimeline schedule={after} currentTime="08:00" showAdjustDay={false} />)
    expect(screen.getByText('Fractions review')).toBeInTheDocument()
    expect(screen.queryByText('Science')).not.toBeInTheDocument()
  })
})

// UAT 8.3 (2026-10-12): a learner's "My day" marks lessons done from the timeline.
describe('ScheduleTimeline — Mark done', () => {
  function schedule() {
    return buildDailySchedule(
      [makeLesson('l1', 'Mathematics', 'not_started'), makeLesson('l2', 'Science', 'completed'), makeLesson('l3', 'Art', 'skipped')],
      { startTime: '08:30', transitionMinutes: 10 },
    )
  }

  test('offers Mark done on a lesson that is not done yet, and calls the handler with its id', () => {
    const onMarkDone = jest.fn()
    render(<ScheduleTimeline schedule={schedule()} currentTime="09:00" showAdjustDay={false} onMarkDone={onMarkDone} />)
    fireEvent.click(screen.getByRole('button', { name: 'Mark Mathematics done' }))
    expect(onMarkDone).toHaveBeenCalledWith('l1')
  })

  test('no Mark done on lessons already done or skipped', () => {
    render(<ScheduleTimeline schedule={schedule()} currentTime="09:00" showAdjustDay={false} onMarkDone={jest.fn()} />)
    expect(screen.queryByRole('button', { name: 'Mark Science done' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Mark Art done' })).not.toBeInTheDocument()
  })

  test('without a handler there is no Mark done (the parent Dashboard is unchanged)', () => {
    render(<ScheduleTimeline schedule={schedule()} currentTime="09:00" showAdjustDay={false} onEditLesson={jest.fn()} />)
    expect(screen.queryByRole('button', { name: /^Mark .* done$/ })).not.toBeInTheDocument()
  })
})

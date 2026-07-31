import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { TodaySchedulePanel } from '@/features/dashboard/front/components/TodaySchedulePanel'
import type { DaySchedule } from '@/features/schedule/types'
import type { SubjectCourse } from '@/features/subjects/types'

let capturedOnEditLesson: ((id: string) => void) | undefined
jest.mock('@/features/schedule/front/components/ScheduleTimeline', () => ({
  ScheduleTimeline: (props: { onEditLesson?: (id: string) => void }) => {
    capturedOnEditLesson = props.onEditLesson
    return <div data-testid="schedule-timeline" />
  },
}))

jest.mock('@/features/dashboard/front/components/EditLessonModal', () => ({
  EditLessonModal: ({ lessonId, onClose }: { lessonId: string; onClose: () => void }) => (
    <div data-testid="edit-lesson-modal" data-lesson-id={lessonId}>
      <button type="button" onClick={onClose}>Close</button>
    </div>
  ),
}))

const mockGetLessons = jest.fn()
jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: (...args: unknown[]) => mockGetLessons(...args) },
}))

const schedule: DaySchedule = {
  date: '2026-05-24',
  blocks: [],
  entries: [],
  isPaused: false,
}

const mathSubject = { id: 'subj_math', name: 'Math', learnerIds: ['child_001'], isActive: true } as SubjectCourse

beforeEach(() => {
  capturedOnEditLesson = undefined
  mockGetLessons.mockReset()
  mockGetLessons.mockResolvedValue([])
})

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

  test('edit lesson opens an inline popup instead of navigating away', async () => {
    render(<TodaySchedulePanel schedule={schedule} currentTime="10:00" />)
    expect(screen.queryByTestId('edit-lesson-modal')).not.toBeInTheDocument()
    expect(capturedOnEditLesson).toBeInstanceOf(Function)

    act(() => capturedOnEditLesson!('lesson_abc'))

    await waitFor(() => {
      expect(screen.getByTestId('edit-lesson-modal')).toHaveAttribute('data-lesson-id', 'lesson_abc')
    })
  })

  test('closing the popup removes it', async () => {
    render(<TodaySchedulePanel schedule={schedule} currentTime="10:00" />)
    act(() => capturedOnEditLesson!('lesson_abc'))
    await waitFor(() => expect(screen.getByTestId('edit-lesson-modal')).toBeInTheDocument())

    fireEvent.click(screen.getByText('Close'))
    expect(screen.queryByTestId('edit-lesson-modal')).not.toBeInTheDocument()
  })

  test('shows quick-start-by-course list when a learnerId is provided, instead of only a link', async () => {
    mockGetLessons.mockResolvedValue([])
    render(
      <TodaySchedulePanel
        schedule={schedule}
        currentTime="10:00"
        subjects={[mathSubject]}
        learnerId="child_001"
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('quick-start-course-subj_math')).toBeInTheDocument()
    })
  })

  test('falls back to the "Start learning time" link when no learnerId is provided', () => {
    render(<TodaySchedulePanel schedule={schedule} currentTime="10:00" />)
    expect(screen.getByTestId('start-learning-time')).toHaveAttribute('href', '/learning-time')
  })
})

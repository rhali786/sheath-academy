import { useCallback, useEffect, useMemo, useState } from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { TodaySchedulePanel } from '@/features/dashboard/front/components/TodaySchedulePanel'
import { buildDailySchedule } from '@/features/schedule/server/service'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { StudentProfile } from '@/features/lib/types'

/**
 * UAT 3.8, reproduced on dev 2026-10-12: Dashboard → pencil → set a time → Save. The
 * window closed and the server had the new time, but Today's Schedule kept the old one
 * until a reload. The panel's own tests mock both the timeline and the window, so this
 * flow runs them for real; only the API and household data are mocked.
 */

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  usePathname: () => '/dashboard',
  useSearchParams: () => new URLSearchParams(),
}))

const store: { lesson: LessonTask } = { lesson: undefined as unknown as LessonTask }
jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(async () => [store.lesson]),
    getLesson: jest.fn(async () => store.lesson),
    updateLesson: jest.fn(async (_id: string, patch: Partial<LessonTask>) => {
      store.lesson = { ...store.lesson, ...patch } as LessonTask
      return store.lesson
    }),
    deleteLesson: jest.fn(),
  },
}))

jest.mock('@/features/learning-time/front/services/api', () => ({
  learningTimeApi: {
    getActive: jest.fn(async () => ({ status: 'success', data: null, message: '', timestamp: '' })),
    createSession: jest.fn(),
    transition: jest.fn(),
  },
}))

const learner: StudentProfile = { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'a', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
const math: SubjectCourse = {
  id: 'subj_math', childId: 'child_001', learnerIds: ['child_001'], name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z',
  recurringSchedule: [{ daysOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'], startTime: '09:00', endTime: '09:45' }],
}
jest.mock('@/features/household/front/context', () => ({
  useHousehold: () => ({
    householdProfile: { id: 'hh_001' }, studentProfiles: [learner], allSubjects: [math],
    loading: false, needsSetup: false, familyName: '', error: null, refetch: jest.fn(),
  }),
}))

import { plannerApi } from '@/features/plan/front/services/api'

const DATE = '2026-10-12'

/** The Dashboard's wiring: fetch the day's lessons, build the schedule, refetch after a save. */
function DashboardToday() {
  const [lessons, setLessons] = useState<LessonTask[]>([])
  const fetchDay = useCallback(() => { plannerApi.getLessons().then(setLessons) }, [])
  useEffect(() => { fetchDay() }, [fetchDay])
  const schedule = useMemo(
    () => ({ ...buildDailySchedule(lessons, { startTime: '08:30', transitionMinutes: 10, date: DATE, courseTimes: { subj_math: math.recurringSchedule! } }), date: DATE }),
    [lessons],
  )
  return <TodaySchedulePanel schedule={schedule} currentTime="08:00" onLessonSaved={fetchDay} />
}

beforeEach(() => {
  store.lesson = {
    id: 'lesson_1', childId: 'child_001', subjectId: 'subj_math', householdId: 'hh_001', title: 'Fractions',
    dueDate: DATE, status: 'not_started', order: 1, estimatedDuration: '30min',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }
})

function row() { return screen.getByTestId('timeline-entry-block_lesson_1') }

async function openWindow() {
  fireEvent.click(within(row()).getByRole('button', { name: /edit lesson/i }))
  const modal = await screen.findByTestId('edit-lesson-modal')
  await waitFor(() => expect(within(modal).getByLabelText(/start time hour/i)).toBeInTheDocument())
  return modal
}

describe('Dashboard Today — editing a lesson updates the schedule without a reload', () => {
  test('setting a lesson\'s own time moves it on the timeline', async () => {
    render(<DashboardToday />)
    await waitFor(() => expect(row()).toHaveTextContent('9:00 AM'))

    const modal = await openWindow()
    fireEvent.change(within(modal).getByLabelText(/start time hour/i), { target: { value: '1' } })
    fireEvent.change(within(modal).getByLabelText(/start time period/i), { target: { value: 'PM' } })
    fireEvent.change(within(modal).getByLabelText(/end time hour/i), { target: { value: '1' } })
    fireEvent.change(within(modal).getByLabelText(/end time minute/i), { target: { value: '30' } })
    fireEvent.change(within(modal).getByLabelText(/end time period/i), { target: { value: 'PM' } })
    fireEvent.click(within(modal).getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(screen.queryByTestId('edit-lesson-modal')).not.toBeInTheDocument())
    await waitFor(() => expect(row()).toHaveTextContent('1:00 PM'))
  })

  test('clearing the lesson\'s own time puts it back at the course time', async () => {
    store.lesson = { ...store.lesson, scheduledStartTime: '13:00', scheduledEndTime: '13:30' }
    render(<DashboardToday />)
    await waitFor(() => expect(row()).toHaveTextContent('1:00 PM'))

    const modal = await openWindow()
    fireEvent.change(within(modal).getByLabelText(/start time hour/i), { target: { value: '' } })
    fireEvent.change(within(modal).getByLabelText(/end time hour/i), { target: { value: '' } })
    fireEvent.click(within(modal).getByRole('button', { name: /save changes/i }))

    await waitFor(() => expect(row()).toHaveTextContent('9:00 AM'))
  })

  test('a renamed lesson shows its new title', async () => {
    render(<DashboardToday />)
    await waitFor(() => expect(row()).toHaveTextContent('Fractions'))
    const modal = await openWindow()
    fireEvent.change(within(modal).getByLabelText(/title/i), { target: { value: 'Fractions review' } })
    fireEvent.click(within(modal).getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(row()).toHaveTextContent('Fractions review'))
  })
})

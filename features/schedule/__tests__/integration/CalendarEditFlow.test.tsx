import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { StudentProfile } from '@/features/lib/types'

/**
 * Calendar day view → pencil. It used to send the parent to /lessons?editId= and lose
 * their place; now the Edit lesson window opens over the Calendar and the day updates
 * after a save or delete without a reload. Real timeline and real window; only the API,
 * household, and the calendar chrome around them are mocked.
 */

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  usePathname: () => '/plan/schedule',
  useSearchParams: () => new URLSearchParams('date=2026-10-14&view=day'),
}))

let serverLessons: LessonTask[] = []
jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(async () => serverLessons),
    getLesson: jest.fn(async (id: string) => serverLessons.find(l => l.id === id) ?? null),
    updateLesson: jest.fn(async (id: string, patch: Partial<LessonTask>) => {
      serverLessons = serverLessons.map(l => (l.id === id ? { ...l, ...patch } as LessonTask : l))
      return serverLessons.find(l => l.id === id)
    }),
    deleteLesson: jest.fn(async (id: string) => {
      serverLessons = serverLessons.filter(l => l.id !== id)
      return 1
    }),
  },
}))

const adam: StudentProfile = { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'a', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
const math: SubjectCourse = { id: 'subj_math', childId: 'child_001', learnerIds: ['child_001'], name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' }
jest.mock('@/features/household/front/context', () => ({
  useHousehold: () => ({
    householdProfile: { id: 'hh_001', weekStartDay: 'Monday' }, studentProfiles: [adam], allSubjects: [math],
    loading: false, needsSetup: false, familyName: '', error: null, refetch: jest.fn(),
  }),
}))
jest.mock('@/features/layout/front/context/LearnerContext', () => ({
  useLearner: () => ({ selectedChildId: null, setSelectedChildId: jest.fn() }),
}))
jest.mock('@/features/schedule/front/components/CalendarNav', () => ({ CalendarNav: () => null }))
jest.mock('@/features/schedule/front/components/ScheduleAttendanceCapture', () => ({ ScheduleAttendanceCapture: () => null }))

import { SchedulePage } from '@/features/schedule/front/pages/SchedulePage'
import { plannerApi } from '@/features/plan/front/services/api'

beforeEach(() => {
  jest.clearAllMocks()
  serverLessons = [{
    id: 'lesson_1', childId: 'child_001', subjectId: 'subj_math', householdId: 'hh_001', title: 'Fractions',
    dueDate: '2026-10-14', status: 'not_started', order: 1, estimatedDuration: '30min',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
  }]
})

async function openPencil() {
  const row = await screen.findByTestId('timeline-entry-block_lesson_1')
  fireEvent.click(within(row).getByRole('button', { name: /edit lesson/i }))
  const dialog = await screen.findByRole('dialog', { name: /edit lesson/i })
  await waitFor(() => expect(within(dialog).getByLabelText(/^title$/i)).toBeInTheDocument())
  return dialog
}

describe('Calendar — edit a lesson in place', () => {
  test('the pencil opens the Edit lesson window over the Calendar (no navigation)', async () => {
    render(<SchedulePage />)
    await openPencil()
    expect(mockPush).not.toHaveBeenCalled()
    expect(screen.getByTestId('schedule-page')).toBeInTheDocument()
  })

  test('a rename shows on the Calendar right after Save', async () => {
    render(<SchedulePage />)
    const dialog = await openPencil()
    fireEvent.change(within(dialog).getByLabelText(/^title$/i), { target: { value: 'Fractions review' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(screen.getByTestId('timeline-entry-block_lesson_1')).toHaveTextContent('Fractions review'))
    expect(plannerApi.getLessons).toHaveBeenCalledTimes(2)
  })

  test('a new time shows on the Calendar right after Save', async () => {
    render(<SchedulePage />)
    const dialog = await openPencil()
    fireEvent.change(within(dialog).getByLabelText(/start time hour/i), { target: { value: '1' } })
    fireEvent.change(within(dialog).getByLabelText(/start time period/i), { target: { value: 'PM' } })
    fireEvent.change(within(dialog).getByLabelText(/end time hour/i), { target: { value: '1' } })
    fireEvent.change(within(dialog).getByLabelText(/end time minute/i), { target: { value: '30' } })
    fireEvent.change(within(dialog).getByLabelText(/end time period/i), { target: { value: 'PM' } })
    fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }))
    await waitFor(() => expect(screen.getByTestId('timeline-entry-block_lesson_1')).toHaveTextContent('1:00 PM'))
  })

  test('a deleted lesson disappears from the Calendar', async () => {
    render(<SchedulePage />)
    const dialog = await openPencil()
    fireEvent.click(within(dialog).getByRole('button', { name: /delete this lesson/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(screen.queryByTestId('timeline-entry-block_lesson_1')).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  test('Cancel leaves the Calendar as it was and does not refetch', async () => {
    render(<SchedulePage />)
    const dialog = await openPencil()
    fireEvent.click(within(dialog).getByRole('button', { name: /^cancel$/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(plannerApi.getLessons).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('timeline-entry-block_lesson_1')).toHaveTextContent('Fractions')
  })
})

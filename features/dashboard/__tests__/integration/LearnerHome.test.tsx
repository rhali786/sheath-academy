import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LearnerHome } from '@/features/dashboard/front/pages/LearnerHome'
import type { LessonTask } from '@/features/plan/types'

/**
 * UAT 8.3 (Amir, 2026-10-12): a learner login's Home said "Error Loading Dashboard". The
 * parent Dashboard loads household-wide, parent-only data (summary, records, alerts, school
 * year) that the learner policy refuses. A learner's Home is "My day": only their own things,
 * from endpoints a learner may use.
 */

jest.mock('@/features/household/front/context', () => ({ useHousehold: jest.fn() }))
jest.mock('@/features/layout/front/context/LearnerContext', () => ({ useLearner: jest.fn() }))
jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: jest.fn(), completeLesson: jest.fn() },
}))
jest.mock('@/features/quran/front/services/api', () => ({
  quranApi: { getSessions: jest.fn(), addSession: jest.fn() },
}))
jest.mock('@/features/learning-time/front/services/api', () => ({
  learningTimeApi: { list: jest.fn(), getActive: jest.fn(), createSession: jest.fn() },
}))
jest.mock('@/features/todos/front/services/api', () => ({
  todosApi: { list: jest.fn(), create: jest.fn(), toggle: jest.fn(), remove: jest.fn() },
}))
// Parent-only: My day must never call these.
jest.mock('@/features/dashboard/front/services/api', () => ({
  dashboardApi: { getSummary: jest.fn(), getRecords: jest.fn() },
}))
jest.mock('@/features/alerts/front/services/api', () => ({ alertsApi: { getAlerts: jest.fn() } }))

import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { plannerApi } from '@/features/plan/front/services/api'
import { quranApi } from '@/features/quran/front/services/api'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import { todosApi } from '@/features/todos/front/services/api'
import { dashboardApi } from '@/features/dashboard/front/services/api'
import { alertsApi } from '@/features/alerts/front/services/api'

const mockGetLessons = plannerApi.getLessons as jest.Mock
const mockCompleteLesson = plannerApi.completeLesson as jest.Mock
const mockGetQuran = quranApi.getSessions as jest.Mock
const mockAddQuran = quranApi.addSession as jest.Mock

function todayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function lesson(id: string, title: string, status: LessonTask['status'] = 'not_started'): LessonTask {
  return {
    id, title, status, childId: 'learner_self', subjectId: 'course_math', householdId: 'hh_a',
    dueDate: todayStr(), order: 1, estimatedDuration: '30min',
    createdAt: '2026-10-01T00:00:00Z', updatedAt: '2026-10-01T00:00:00Z',
  }
}

const SELF = { id: 'learner_self', name: 'Yusuf Ali', firstName: 'Yusuf', householdId: 'hh_a', gradeLabel: 'Grade 5', username: '', password: '', isActive: true, createdAt: '2026-01-01' }

beforeEach(() => {
  ;(useHousehold as jest.Mock).mockImplementation(() => ({
    studentProfiles: [SELF],
    allSubjects: [{ id: 'course_math', name: 'Math', category: 'Math', learnerIds: ['learner_self'], isActive: true, order: 0, createdAt: '2026-01-01' }],
    loading: false,
  }))
  ;(useLearner as jest.Mock).mockImplementation(() => ({ selectedChildId: 'learner_self', setSelectedChildId: jest.fn() }))
  mockGetLessons.mockResolvedValue([lesson('l1', 'Fractions'), lesson('l2', 'Plants', 'completed')])
  mockCompleteLesson.mockImplementation(async (id: string) => ({ ...lesson(id, 'Fractions'), status: 'completed' }))
  mockGetQuran.mockResolvedValue({ data: { sessions: [], chartData: [] } })
  mockAddQuran.mockResolvedValue({ data: {} })
  ;(learningTimeApi.list as jest.Mock).mockResolvedValue({ data: [] })
  ;(learningTimeApi.getActive as jest.Mock).mockResolvedValue({ data: null })
  ;(todosApi.list as jest.Mock).mockResolvedValue({ data: [] })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('LearnerHome ("My day")', () => {
  it('greets the learner by first name', async () => {
    render(<LearnerHome />)
    expect(screen.getByRole('heading', { name: /Marhaba, Yusuf/ })).toBeInTheDocument()
    await screen.findByText('Fractions')
  })

  it('shows a loading state while today’s lessons load', () => {
    mockGetLessons.mockReturnValue(new Promise(() => {}))
    render(<LearnerHome />)
    expect(screen.getByText('Loading your day…')).toBeInTheDocument()
  })

  it('loads only this learner’s lessons for today', async () => {
    render(<LearnerHome />)
    await screen.findByText('Fractions')
    expect(mockGetLessons).toHaveBeenCalledWith(undefined, ['learner_self'], undefined, todayStr(), todayStr())
  })

  it('says so when nothing is planned today', async () => {
    mockGetLessons.mockResolvedValue([])
    render(<LearnerHome />)
    expect(await screen.findByText('Nothing planned for today.')).toBeInTheDocument()
  })

  it('says why and offers to try again when today’s lessons fail to load', async () => {
    mockGetLessons.mockRejectedValueOnce(new Error('network'))
    render(<LearnerHome />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t load today’s lessons.')
    mockGetLessons.mockResolvedValue([lesson('l1', 'Fractions')])
    await userEvent.setup().click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Fractions')).toBeInTheDocument()
  })

  it('has no edit pencil — a learner cannot edit lessons', async () => {
    render(<LearnerHome />)
    await screen.findByText('Fractions')
    expect(screen.queryByRole('button', { name: /edit lesson/i })).not.toBeInTheDocument()
  })

  it('Mark done marks the lesson done and the row shows it right away', async () => {
    render(<LearnerHome />)
    await screen.findByText('Fractions')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Mark Fractions done' }))
    expect(mockCompleteLesson).toHaveBeenCalledWith('l1')
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Mark Fractions done' })).not.toBeInTheDocument())
    expect(screen.queryByRole('button', { name: 'Mark Plants done' })).not.toBeInTheDocument()
  })

  it('keeps the Mark done button and says why when marking done fails', async () => {
    mockCompleteLesson.mockRejectedValueOnce(new Error('Learners are not allowed to make this change.'))
    render(<LearnerHome />)
    await screen.findByText('Fractions')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Mark Fractions done' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Couldn’t mark “Fractions” done. Please try again.')
    expect(screen.getByRole('button', { name: 'Mark Fractions done' })).toBeInTheDocument()
  })

  it('shows the learner’s own Quran streak, learning time, to-dos and the Islamic calendar', async () => {
    render(<LearnerHome />)
    await screen.findByText('Fractions')
    expect(mockGetQuran).toHaveBeenCalledWith('learner_self')
    expect(screen.getByRole('heading', { name: 'Quran Streak' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Learning Time' })).toBeInTheDocument()
    expect(screen.getByTestId('personal-todo-list')).toBeInTheDocument()
    expect(screen.getByTestId('islamic-calendar-card')).toBeInTheDocument()
  })

  it('logs a Quran session for the learner and refreshes the streak', async () => {
    render(<LearnerHome />)
    await screen.findByText('Fractions')
    await userEvent.setup().click(screen.getByRole('button', { name: 'Log Quran Session' }))
    const heading = await screen.findByRole('heading', { name: 'Log Quran Session' })
    fireEvent.submit(heading.closest('div')!.parentElement!.querySelector('form')!)
    await waitFor(() => expect(mockAddQuran).toHaveBeenCalledWith(expect.objectContaining({ childId: 'learner_self' })))
    await waitFor(() => expect(mockGetQuran).toHaveBeenCalledTimes(2))
  })

  it('never asks for parent-only data', async () => {
    render(<LearnerHome />)
    await screen.findByText('Fractions')
    expect(dashboardApi.getSummary).not.toHaveBeenCalled()
    expect(dashboardApi.getRecords).not.toHaveBeenCalled()
    expect(alertsApi.getAlerts).not.toHaveBeenCalled()
  })
})

import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { QuickStartByCourseList } from '@/features/learning-time/front/components/QuickStartByCourseList'
import type { SubjectCourse } from '@/features/subjects/types'
import type { LessonTask } from '@/features/plan/types'

const mockGetLessons = jest.fn()
const mockCreateSession = jest.fn()
const mockTransition = jest.fn()

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLessons: (...args: unknown[]) => mockGetLessons(...args) },
}))

jest.mock('@/features/learning-time/front/services/api', () => ({
  learningTimeApi: {
    createSession: (...args: unknown[]) => mockCreateSession(...args),
    transition: (...args: unknown[]) => mockTransition(...args),
  },
}))

function ok<T>(data: T) {
  return { status: 'success' as const, data, message: '', timestamp: '2026-01-01T00:00:00Z' }
}

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'l1',
    childId: 'child_001',
    subjectId: 'subj_math',
    householdId: 'hh_001',
    title: 'Lesson',
    dueDate: '2026-07-15',
    status: 'not_started',
    order: 0,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const mathSubject = { id: 'subj_math', name: 'Math', learnerIds: ['child_001'], isActive: true } as SubjectCourse
const readingSubject = { id: 'subj_reading', name: 'Reading', learnerIds: ['child_001'], isActive: true } as SubjectCourse
const otherLearnerSubject = { id: 'subj_other', name: 'Art', learnerIds: ['child_999'], isActive: true } as SubjectCourse

beforeEach(() => {
  jest.clearAllMocks()
  mockGetLessons.mockResolvedValue([])
})

describe('QuickStartByCourseList', () => {
  it('lists only courses the learner is enrolled in, with duration from the next open lesson', async () => {
    mockGetLessons.mockResolvedValue([
      makeLesson({ id: 'l1', subjectId: 'subj_math', estimatedDuration: '30min' }),
    ])
    render(
      <QuickStartByCourseList
        learnerId="child_001"
        allSubjects={[mathSubject, readingSubject, otherLearnerSubject]}
        onStarted={jest.fn()}
      />,
    )
    await waitFor(() => {
      expect(screen.getByTestId('quick-start-course-subj_math')).toBeInTheDocument()
    })
    expect(screen.getByTestId('quick-start-duration-subj_math')).toHaveTextContent(/30 ?min/i)
    expect(screen.getByTestId('quick-start-course-subj_reading')).toBeInTheDocument()
    expect(screen.getByTestId('quick-start-duration-subj_reading')).toHaveTextContent(/no duration set/i)
    expect(screen.queryByTestId('quick-start-course-subj_other')).not.toBeInTheDocument()
  })

  it('renders nothing when the learner has no enrolled courses', async () => {
    const { container } = render(
      <QuickStartByCourseList learnerId="child_001" allSubjects={[otherLearnerSubject]} onStarted={jest.fn()} />,
    )
    await waitFor(() => expect(mockGetLessons).toHaveBeenCalled())
    expect(container).toBeEmptyDOMElement()
  })

  it('clicking Start creates and starts a stopwatch session, then calls onStarted — no navigation, no extra config', async () => {
    mockCreateSession.mockResolvedValue(ok({ id: 'lts_1', status: 'draft' }))
    mockTransition.mockResolvedValue(ok({ id: 'lts_1', status: 'running' }))
    const onStarted = jest.fn()

    render(
      <QuickStartByCourseList learnerId="child_001" allSubjects={[mathSubject]} onStarted={onStarted} />,
    )
    await waitFor(() => expect(screen.getByTestId('quick-start-course-subj_math')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('quick-start-course-subj_math'))

    await waitFor(() => expect(onStarted).toHaveBeenCalledWith({ id: 'lts_1', status: 'running' }))
    expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
      learnerId: 'child_001',
      subjectId: 'subj_math',
      timeChannelType: 'stopwatch',
    }))
    expect(mockTransition).toHaveBeenCalledWith('lts_1', { action: 'start' })
  })

  it('shows an error message and does not call onStarted when starting fails', async () => {
    mockCreateSession.mockRejectedValue(new Error('boom'))
    const onStarted = jest.fn()

    render(
      <QuickStartByCourseList learnerId="child_001" allSubjects={[mathSubject]} onStarted={onStarted} />,
    )
    await waitFor(() => expect(screen.getByTestId('quick-start-course-subj_math')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('quick-start-course-subj_math'))

    await waitFor(() => {
      expect(screen.getByText(/failed to start session/i)).toBeInTheDocument()
    })
    expect(onStarted).not.toHaveBeenCalled()
  })
})

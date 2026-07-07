import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { LearningTimePage } from '@/features/learning-time/front/pages/LearningTimePage'
import { LearnerProvider } from '@/features/layout/front/context/LearnerContext'
import type { LearningTimeSession } from '@/features/learning-time/types'
import type { LessonTask } from '@/features/plan/types'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

let mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/learning-time/front/services/api', () => ({
  learningTimeApi: {
    createSession: jest.fn(),
    transition: jest.fn(),
    getActive: jest.fn(),
    list: jest.fn(),
  },
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(),
  },
}))

jest.mock('@/features/subjects/front/services/api', () => ({
  subjectsApi: {
    getSubjects: jest.fn(),
  },
}))

import { useHousehold } from '@/features/household/front/context'
import { learningTimeApi } from '@/features/learning-time/front/services/api'
import { plannerApi } from '@/features/plan/front/services/api'
import { subjectsApi } from '@/features/subjects/front/services/api'

const mockUseHousehold = useHousehold as jest.Mock
const mockGetActive = learningTimeApi.getActive as jest.Mock
const mockCreateSession = learningTimeApi.createSession as jest.Mock
const mockTransition = learningTimeApi.transition as jest.Mock
const mockGetLessons = plannerApi.getLessons as jest.Mock
const mockGetSubjects = subjectsApi.getSubjects as jest.Mock
const mockList = learningTimeApi.list as jest.Mock

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: '', timestamp: '' }
}

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function makeSession(overrides: Partial<LearningTimeSession> = {}): LearningTimeSession {
  return {
    id: 'lts_001',
    householdId: 'hh_001',
    learnerId: 'child_001',
    subjectId: null,
    lessonTaskId: null,
    timeChannelType: 'stopwatch',
    targetMinutes: null,
    scheduledStart: null,
    scheduledEnd: null,
    status: 'running',
    startedAt: '2026-06-12T10:00:00.000Z',
    pausedAt: null,
    endedAt: null,
    endedBy: null,
    outcome: null,
    notes: null,
    createdAt: '2026-06-12T10:00:00.000Z',
    updatedAt: '2026-06-12T10:00:00.000Z',
    elapsedSeconds: 0,
    ...overrides,
  }
}

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'lesson_001',
    childId: 'child_001',
    subjectId: 'subj_001',
    householdId: 'hh_001',
    title: 'Algebra worksheet',
    dueDate: todayLocal(),
    status: 'not_started',
    order: 0,
    createdAt: '2026-06-12T00:00:00.000Z',
    updatedAt: '2026-06-12T00:00:00.000Z',
    ...overrides,
  }
}

function renderPage() {
  return render(
    <LearnerProvider>
      <LearningTimePage />
    </LearnerProvider>,
  )
}

beforeEach(() => {
  mockSearchParams = new URLSearchParams()
  mockUseHousehold.mockImplementation(() => ({
    householdProfile: { id: 'hh_001' },
    studentProfiles: mockChildren,
    allSubjects: [],
    loading: false,
    needsSetup: false,
    familyName: '',
    error: null,
    refetch: jest.fn(),
  }))
  mockGetActive.mockResolvedValue(ok(null))
  mockGetLessons.mockResolvedValue([])
  mockGetSubjects.mockResolvedValue(ok([]))
  mockCreateSession.mockResolvedValue(ok(makeSession({ status: 'draft', startedAt: null })))
  mockTransition.mockResolvedValue(ok(makeSession()))
  mockList.mockResolvedValue(ok([]))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('LearningTimePage', () => {
  it('renders the page heading', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /learning time/i, level: 1 })).toBeInTheDocument()
    })
  })

  it('renders an empty state when the household has no learners', async () => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001' },
      studentProfiles: [],
      allSubjects: [],
      loading: false,
      needsSetup: false,
      familyName: '',
      error: null,
      refetch: jest.fn(),
    }))
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('learning-time-empty')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('learner-select')).not.toBeInTheDocument()
  })

  it('shows a loading state before the active session is known', async () => {
    let resolveActive: (value: ApiResponse<LearningTimeSession | null>) => void = () => {}
    mockGetActive.mockReturnValue(new Promise(resolve => { resolveActive = resolve }))
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('now-card-loading')).toBeInTheDocument()
    })
    resolveActive(ok(null))
    await waitFor(() => {
      expect(screen.getByTestId('now-card-idle')).toBeInTheDocument()
    })
  })

  it('renders idle state with "Nothing assigned now" when there is no active session or lesson today', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('now-card-idle')).toBeInTheDocument()
    })
    expect(screen.getByText(/idle.*awaiting assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/nothing assigned now/i)).toBeInTheDocument()
    expect(screen.getByTestId('start-session-button')).toBeInTheDocument()
  })

  it('renders idle state with a "Next" preview when a lesson is due today', async () => {
    mockGetLessons.mockResolvedValue([makeLesson({ title: 'Algebra worksheet', estimatedDuration: '30min' })])
    renderPage()
    await waitFor(() => {
      expect(screen.getByText(/next: algebra worksheet/i)).toBeInTheDocument()
    })
  })

  it('clicking "Start session" opens the draft configuration form', async () => {
    renderPage()
    await waitFor(() => {
      expect(screen.getByTestId('now-card-idle')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByTestId('start-session-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-config')).toBeInTheDocument()
    })
    expect(screen.getByLabelText(/stopwatch/i)).toBeChecked()
    expect(screen.getByTestId('start-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-config-button')).toBeInTheDocument()
  })

  it('shows a target minutes input when Timer is selected', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText(/^timer$/i))

    expect(screen.getByTestId('target-minutes-input')).toBeInTheDocument()
  })

  it('shows start/end time inputs when Scheduled window is selected', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText(/scheduled window/i))

    expect(screen.getByTestId('scheduled-start-input')).toBeInTheDocument()
    expect(screen.getByTestId('scheduled-end-input')).toBeInTheDocument()
  })

  it('shows helper text under the Scheduled window time inputs — regression for 36f30694', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText(/scheduled window/i))

    expect(screen.getByText(/applies to this session only.*not.*recurring/i)).toBeInTheDocument()
  })

  it('"Cancel" returns from the configuration form to idle', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('cancel-config-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-idle')).toBeInTheDocument()
    })
  })

  it('starting a Timer session creates and starts it, then renders the Running state', async () => {
    mockCreateSession.mockResolvedValue(ok(makeSession({ id: 'lts_002', status: 'draft', timeChannelType: 'timer', targetMinutes: 25, startedAt: null })))
    mockTransition.mockResolvedValue(ok(makeSession({ id: 'lts_002', status: 'running', timeChannelType: 'timer', targetMinutes: 25, elapsedSeconds: 0 })))

    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.click(screen.getByLabelText(/^timer$/i))
    fireEvent.change(screen.getByTestId('target-minutes-input'), { target: { value: '25' } })
    fireEvent.click(screen.getByTestId('start-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-running')).toBeInTheDocument()
    })

    expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
      learnerId: 'child_001',
      timeChannelType: 'timer',
      targetMinutes: 25,
    }))
    expect(mockTransition).toHaveBeenCalledWith('lts_002', { action: 'start' })
    expect(screen.getByTestId('pause-button')).toBeInTheDocument()
    expect(screen.getByTestId('finish-button')).toBeInTheDocument()
    const elapsed = screen.getByTestId('elapsed-time')
    expect(elapsed).toHaveAttribute('aria-live', 'polite')
  })

  it('restores a running session with server-computed elapsed time on mount', async () => {
    mockGetActive.mockResolvedValue(ok(makeSession({ status: 'running', elapsedSeconds: 125 })))

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('now-card-running')).toBeInTheDocument()
    })
    expect(screen.getByTestId('elapsed-time')).toHaveTextContent(/^02:0\d$/)
  })

  it('"Pause" transitions a running stopwatch session to Paused', async () => {
    mockGetActive.mockResolvedValue(ok(makeSession({ status: 'running', elapsedSeconds: 60 })))
    mockTransition.mockResolvedValue(ok(makeSession({ status: 'paused', elapsedSeconds: 60, pausedAt: '2026-06-12T10:01:00.000Z' })))

    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-running')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('pause-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-paused')).toBeInTheDocument()
    })
    expect(mockTransition).toHaveBeenCalledWith('lts_001', { action: 'pause' })
    expect(screen.getByTestId('resume-button')).toBeInTheDocument()
    expect(screen.getByTestId('finish-button')).toBeInTheDocument()
    expect(screen.queryByTestId('pause-button')).not.toBeInTheDocument()
  })

  it('"Resume" transitions a paused stopwatch session back to Running', async () => {
    mockGetActive.mockResolvedValue(ok(makeSession({ status: 'paused', elapsedSeconds: 60, pausedAt: '2026-06-12T10:01:00.000Z' })))
    mockTransition.mockResolvedValue(ok(makeSession({ status: 'running', elapsedSeconds: 60, pausedAt: null })))

    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-paused')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('resume-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-running')).toBeInTheDocument()
    })
    expect(mockTransition).toHaveBeenCalledWith('lts_001', { action: 'resume' })
    expect(screen.getByTestId('pause-button')).toBeInTheDocument()
  })

  it('does not show Pause/Resume for a scheduled session', async () => {
    mockGetActive.mockResolvedValue(ok(makeSession({ status: 'running', timeChannelType: 'scheduled', elapsedSeconds: 60 })))

    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-running')).toBeInTheDocument())

    expect(screen.queryByTestId('pause-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('resume-button')).not.toBeInTheDocument()
    expect(screen.getByTestId('finish-button')).toBeInTheDocument()
  })

  it('"Finish" transitions a running session to the Ended state', async () => {
    mockGetActive.mockResolvedValue(ok(makeSession({ status: 'running', elapsedSeconds: 600 })))
    mockTransition.mockResolvedValue(ok(makeSession({ status: 'ended', elapsedSeconds: 600, endedAt: '2026-06-12T10:10:00.000Z', endedBy: 'manual' })))

    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-running')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('finish-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-ended')).toBeInTheDocument()
    })
    expect(mockTransition).toHaveBeenCalledWith('lts_001', { action: 'end' })
    expect(screen.getByTestId('outcome-complete')).toBeInTheDocument()
    expect(screen.getByTestId('outcome-partial')).toBeInTheDocument()
    expect(screen.getByTestId('outcome-abandoned')).toBeInTheDocument()
    expect(screen.getByTestId('notes-textarea')).toBeInTheDocument()
    expect(screen.getByTestId('save-outcome-button')).toBeInTheDocument()
  })

  it('saving the outcome finalizes the session and shows the Finalized summary', async () => {
    mockGetActive.mockResolvedValue(ok(makeSession({ status: 'ended', elapsedSeconds: 600, endedAt: '2026-06-12T10:10:00.000Z', endedBy: 'manual' })))
    mockTransition.mockResolvedValue(ok(makeSession({ status: 'finalized', elapsedSeconds: 600, endedAt: '2026-06-12T10:10:00.000Z', endedBy: 'manual', outcome: 'partial', notes: 'Good progress' })))

    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-ended')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('outcome-partial'))
    fireEvent.change(screen.getByTestId('notes-textarea'), { target: { value: 'Good progress' } })
    fireEvent.click(screen.getByTestId('save-outcome-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-finalized')).toBeInTheDocument()
    })
    expect(mockTransition).toHaveBeenCalledWith('lts_001', { action: 'finalize', outcome: 'partial', notes: 'Good progress' })
    expect(screen.getByTestId('start-another-button')).toBeInTheDocument()
  })

  it('"Start another session" returns to idle from the Finalized state', async () => {
    mockGetActive.mockResolvedValue(ok(makeSession({ status: 'ended', elapsedSeconds: 600, endedAt: '2026-06-12T10:10:00.000Z', endedBy: 'manual' })))
    mockTransition.mockResolvedValue(ok(makeSession({ status: 'finalized', elapsedSeconds: 600, endedAt: '2026-06-12T10:10:00.000Z', endedBy: 'manual', outcome: 'complete', notes: null })))

    renderPage()
    await waitFor(() => expect(screen.getByTestId('now-card-ended')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('save-outcome-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-finalized')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('start-another-button'))

    await waitFor(() => {
      expect(screen.getByTestId('now-card-idle')).toBeInTheDocument()
    })
  })
})

describe('LearningTimePage — course selection (feedback 66087f44)', () => {
  const secondChild: StudentProfile = {
    id: 'child_002',
    householdId: 'hh_001',
    name: 'Sara',
    gradeLabel: '3rd',
    isActive: true,
    username: 'sara',
    password: 'pw',
    createdAt: '2026-01-01T00:00:00Z',
  }

  const mathSubject = { id: 'subj_math', name: 'Math', learnerIds: ['child_001'], isActive: true } as SubjectCourse
  const readingSubject = { id: 'subj_reading', name: 'Reading', learnerIds: ['child_002'], isActive: true } as SubjectCourse

  beforeEach(() => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001' },
      studentProfiles: [...mockChildren, secondChild],
      allSubjects: [mathSubject, readingSubject],
      loading: false,
      needsSetup: false,
      familyName: '',
      error: null,
      refetch: jest.fn(),
    }))
  })

  it('shows a Course selector defaulting to "All courses"', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('course-select')).toBeInTheDocument())
    expect(screen.getByTestId('course-select')).toHaveValue('')
    expect(screen.getByText('All courses')).toBeInTheDocument()
  })

  it('selecting a course narrows the Learner dropdown to its enrolled learners and switches the selection', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('course-select')).toBeInTheDocument())

    fireEvent.change(screen.getByTestId('course-select'), { target: { value: 'subj_reading' } })

    await waitFor(() => {
      expect(screen.getByTestId('learner-select')).toHaveValue('child_002')
    })
    const learnerSelect = screen.getByTestId('learner-select') as HTMLSelectElement
    const optionLabels = Array.from(learnerSelect.options).map(o => o.textContent)
    expect(optionLabels).toEqual(['Sara'])
  })

  it('selecting "All courses" restores the full learner list', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('course-select')).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('course-select'), { target: { value: 'subj_reading' } })
    await waitFor(() => expect(screen.getByTestId('learner-select')).toHaveValue('child_002'))

    fireEvent.change(screen.getByTestId('course-select'), { target: { value: '' } })

    await waitFor(() => {
      const learnerSelect = screen.getByTestId('learner-select') as HTMLSelectElement
      const optionLabels = Array.from(learnerSelect.options).map(o => o.textContent)
      expect(optionLabels).toEqual(['Adam', 'Sara'])
    })
  })

  it('shows a hint explaining that the Learner list is narrowed by course', async () => {
    renderPage()
    await waitFor(() => expect(screen.getByTestId('course-select')).toBeInTheDocument())
    expect(screen.getByTestId('course-select-hint')).toHaveTextContent(/only learners enrolled in this course/i)
  })

  it('when a course is chosen, the session form shows it as a locked, read-only Course value (no duplicate picker)', async () => {
    mockGetSubjects.mockResolvedValue(ok([mathSubject]))
    renderPage()
    await waitFor(() => expect(screen.getByTestId('course-select')).toBeInTheDocument())

    fireEvent.change(screen.getByTestId('course-select'), { target: { value: 'subj_math' } })
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    expect(screen.getByTestId('course-locked-value')).toHaveTextContent('Math')
    expect(screen.queryByTestId('subject-select')).not.toBeInTheDocument()
  })

  it('when no course is chosen ("All courses"), the session form keeps an editable Course dropdown', async () => {
    mockGetSubjects.mockResolvedValue(ok([mathSubject, readingSubject]))
    renderPage()
    await waitFor(() => expect(screen.getByTestId('course-select')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    expect(screen.queryByTestId('course-locked-value')).not.toBeInTheDocument()
    const subjectSelect = screen.getByTestId('subject-select') as HTMLSelectElement
    expect(subjectSelect).toHaveValue('')
    expect(screen.getByText('No course')).toBeInTheDocument()

    fireEvent.change(subjectSelect, { target: { value: 'subj_math' } })
    expect(subjectSelect).toHaveValue('subj_math')
  })
})

describe('LearningTimePage — session history', () => {
  it('shows a loading state for session history before the list resolves', async () => {
    let resolveList: (value: ApiResponse<LearningTimeSession[]>) => void = () => {}
    mockList.mockReturnValue(new Promise(resolve => { resolveList = resolve }))

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('session-history-loading')).toBeInTheDocument()
    })

    resolveList(ok([]))

    await waitFor(() => {
      expect(screen.getByTestId('session-history-empty')).toBeInTheDocument()
    })
  })

  it('renders "No completed sessions yet" when the history list is empty', async () => {
    mockList.mockResolvedValue(ok([]))

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('session-history-empty')).toBeInTheDocument()
    })
    expect(screen.getByText(/no completed sessions yet/i)).toBeInTheDocument()
  })

  it('renders finalized sessions with date, subject name, duration, and outcome', async () => {
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001' },
      studentProfiles: mockChildren,
      allSubjects: [{ id: 'subj_001', name: 'Algebra' } as SubjectCourse],
      loading: false,
      needsSetup: false,
      familyName: '',
      error: null,
      refetch: jest.fn(),
    }))
    mockList.mockResolvedValue(ok([
      makeSession({
        id: 'lts_010',
        subjectId: 'subj_001',
        status: 'finalized',
        elapsedSeconds: 1800,
        endedAt: '2026-06-10T11:00:00.000Z',
        outcome: 'complete',
      }),
      makeSession({
        id: 'lts_011',
        subjectId: null,
        status: 'finalized',
        elapsedSeconds: 600,
        endedAt: '2026-06-11T11:00:00.000Z',
        outcome: 'partial',
      }),
    ]))

    renderPage()

    await waitFor(() => {
      expect(screen.getByTestId('session-history-list')).toBeInTheDocument()
    })
    const historyList = within(screen.getByTestId('session-history-list'))
    expect(historyList.getByText('Algebra')).toBeInTheDocument()
    expect(historyList.getByText('No subject')).toBeInTheDocument()
    expect(historyList.getByText('30:00')).toBeInTheDocument()
    expect(historyList.getByText('10:00')).toBeInTheDocument()
    expect(historyList.getByText(/complete/i)).toBeInTheDocument()
    expect(historyList.getByText(/partial/i)).toBeInTheDocument()
  })

  it('switching the learner re-fetches session history for the new learner', async () => {
    const secondChild: StudentProfile = {
      id: 'child_002',
      householdId: 'hh_001',
      name: 'Sara',
      gradeLabel: '3rd',
      isActive: true,
      username: 'sara',
      password: 'pw',
      createdAt: '2026-01-01T00:00:00Z',
    }
    mockUseHousehold.mockImplementation(() => ({
      householdProfile: { id: 'hh_001' },
      studentProfiles: [...mockChildren, secondChild],
      allSubjects: [],
      loading: false,
      needsSetup: false,
      familyName: '',
      error: null,
      refetch: jest.fn(),
    }))
    mockList.mockResolvedValue(ok([]))

    renderPage()

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith({ learnerId: 'child_001' })
    })

    fireEvent.change(screen.getByTestId('learner-select'), { target: { value: 'child_002' } })

    await waitFor(() => {
      expect(mockList).toHaveBeenCalledWith({ learnerId: 'child_002' })
    })
  })
})

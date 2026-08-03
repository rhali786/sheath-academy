import React from 'react'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import { NowCard } from '@/features/learning-time/front/components/NowCard'
import type { LearningTimeSession } from '@/features/learning-time/types'
import type { LessonTask } from '@/features/plan/types'
import type { ApiResponse } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

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

import { learningTimeApi } from '@/features/learning-time/front/services/api'
import { plannerApi } from '@/features/plan/front/services/api'

const mockGetActive = learningTimeApi.getActive as jest.Mock
const mockCreateSession = learningTimeApi.createSession as jest.Mock
const mockTransition = learningTimeApi.transition as jest.Mock
const mockGetLessons = plannerApi.getLessons as jest.Mock

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: '', timestamp: '' }
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
    startedAt: '2026-07-17T10:00:00.000Z',
    pausedAt: null,
    endedAt: null,
    endedBy: null,
    outcome: null,
    notes: null,
    createdAt: '2026-07-17T10:00:00.000Z',
    updatedAt: '2026-07-17T10:00:00.000Z',
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
    dueDate: '2026-07-17',
    status: 'not_started',
    order: 0,
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
    ...overrides,
  }
}

const allSubjects: SubjectCourse[] = []

function renderNowCard() {
  return render(<NowCard learnerId="child_001" allSubjects={allSubjects} />)
}

beforeEach(() => {
  mockGetActive.mockResolvedValue(ok(null))
  mockGetLessons.mockResolvedValue([])
  mockCreateSession.mockResolvedValue(ok(makeSession({ status: 'draft', startedAt: null })))
  mockTransition.mockResolvedValue(ok(makeSession()))
})

afterEach(() => {
  jest.clearAllMocks()
  jest.useRealTimers()
})

describe('NowCard — pre-fill scheduled window from lesson (G9 item 1)', () => {
  it('selecting a lesson with scheduledStartTime/scheduledEndTime auto-selects Scheduled window and fills the time inputs', async () => {
    mockGetLessons.mockResolvedValue([
      makeLesson({ id: 'lesson_sched', title: 'Math with times', scheduledStartTime: '10:15', scheduledEndTime: '10:45' }),
    ])
    renderNowCard()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.change(screen.getByTestId('lesson-select'), { target: { value: 'lesson_sched' } })

    expect(screen.getByLabelText(/scheduled window/i)).toBeChecked()
    expect(screen.getByTestId('scheduled-start-input')).toHaveValue('10:15')
    expect(screen.getByTestId('scheduled-end-input')).toHaveValue('10:45')
  })

  it('selecting a lesson without scheduled times leaves the channel/time fields unchanged (regression)', async () => {
    mockGetLessons.mockResolvedValue([
      makeLesson({ id: 'lesson_plain', title: 'Reading' }),
    ])
    renderNowCard()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.change(screen.getByTestId('lesson-select'), { target: { value: 'lesson_plain' } })

    expect(screen.getByLabelText(/^stopwatch$/i)).toBeChecked()
    expect(screen.queryByTestId('scheduled-start-input')).not.toBeInTheDocument()
  })

  it('selecting an ad-hoc lesson leaves the channel/time fields unchanged (regression)', async () => {
    mockGetLessons.mockResolvedValue([
      makeLesson({ id: 'lesson_sched', title: 'Math with times', scheduledStartTime: '10:15', scheduledEndTime: '10:45' }),
    ])
    renderNowCard()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.change(screen.getByTestId('lesson-select'), { target: { value: 'adhoc' } })

    expect(screen.getByLabelText(/^stopwatch$/i)).toBeChecked()
  })

  it('a pre-filled time value can still be hand-edited by the parent before starting', async () => {
    mockGetLessons.mockResolvedValue([
      makeLesson({ id: 'lesson_sched', title: 'Math with times', scheduledStartTime: '10:15', scheduledEndTime: '10:45' }),
    ])
    renderNowCard()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())
    fireEvent.change(screen.getByTestId('lesson-select'), { target: { value: 'lesson_sched' } })

    fireEvent.change(screen.getByTestId('scheduled-start-input'), { target: { value: '11:00' } })

    expect(screen.getByTestId('scheduled-start-input')).toHaveValue('11:00')
  })
})

describe('NowCard — course-first selector prefill (Wave 3 part 1)', () => {
  it('starting an ad-hoc session tags CreateSessionInput.subjectId with the course passed in via props, with no learner interaction needed first', async () => {
    render(<NowCard learnerId="child_001" course={{ id: 'subj_math', name: 'Math' }} allSubjects={allSubjects} />)
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('start-button'))

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith(expect.objectContaining({
        learnerId: 'child_001',
        subjectId: 'subj_math',
      }))
    })
  })

  it('starting an ad-hoc session with no course prop sends no subjectId', async () => {
    renderNowCard()
    await waitFor(() => expect(screen.getByTestId('now-card-idle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-session-button'))
    await waitFor(() => expect(screen.getByTestId('now-card-config')).toBeInTheDocument())

    fireEvent.click(screen.getByTestId('start-button'))

    await waitFor(() => {
      expect(mockCreateSession).toHaveBeenCalledWith(expect.not.objectContaining({ subjectId: expect.anything() }))
    })
  })
})

describe('NowCard — clock-driven auto-start (G9 item 1)', () => {
  it('calls transition({action:"start"}) automatically, without a click, once wall-clock time passes a draft scheduled session\'s scheduledStart', async () => {
    jest.useFakeTimers({ now: new Date('2026-07-17T10:20:00.000Z') })
    const draftSession = makeSession({
      status: 'draft',
      timeChannelType: 'scheduled',
      scheduledStart: '2026-07-17T10:15:00.000Z',
      scheduledEnd: '2026-07-17T10:45:00.000Z',
      startedAt: null,
    })
    mockGetActive.mockResolvedValue(ok(draftSession))
    mockTransition.mockResolvedValue(ok({ ...draftSession, status: 'running', startedAt: '2026-07-17T10:20:00.000Z' }))

    renderNowCard()
    await act(async () => { await Promise.resolve() })

    await waitFor(() => expect(mockTransition).toHaveBeenCalledTimes(1))
    expect(mockTransition).toHaveBeenCalledWith('lts_001', { action: 'start' })
  })

  it('does not fire the auto-start transition more than once across multiple polling ticks, even before the first call resolves', async () => {
    jest.useFakeTimers({ now: new Date('2026-07-17T10:20:00.000Z') })
    const draftSession = makeSession({
      status: 'draft',
      timeChannelType: 'scheduled',
      scheduledStart: '2026-07-17T10:15:00.000Z',
      scheduledEnd: '2026-07-17T10:45:00.000Z',
      startedAt: null,
    })
    mockGetActive.mockResolvedValue(ok(draftSession))
    let resolveTransition: (v: ApiResponse<LearningTimeSession>) => void = () => {}
    mockTransition.mockReturnValue(new Promise(resolve => { resolveTransition = resolve }))

    renderNowCard()
    await act(async () => { await Promise.resolve() })

    await waitFor(() => expect(mockTransition).toHaveBeenCalledTimes(1))

    // Two more polling ticks fire while the first transition() call is still unresolved.
    await act(async () => { jest.advanceTimersByTime(30_000) })
    await act(async () => { jest.advanceTimersByTime(30_000) })

    expect(mockTransition).toHaveBeenCalledTimes(1)

    resolveTransition(ok({ ...draftSession, status: 'running' }))
    await act(async () => { await Promise.resolve() })

    // Resolving does not retroactively trigger any further calls either.
    expect(mockTransition).toHaveBeenCalledTimes(1)
  })

  it('shows a "Starts at HH:MM" state and does not call transition when scheduledStart is in the future', async () => {
    jest.useFakeTimers({ now: new Date('2026-07-17T09:00:00.000Z') })
    const draftSession = makeSession({
      status: 'draft',
      timeChannelType: 'scheduled',
      scheduledStart: '2026-07-17T10:15:00.000Z',
      scheduledEnd: '2026-07-17T10:45:00.000Z',
      startedAt: null,
    })
    mockGetActive.mockResolvedValue(ok(draftSession))

    renderNowCard()
    await act(async () => { await Promise.resolve() })

    expect(screen.getByTestId('now-card-scheduled-pending')).toBeInTheDocument()
    expect(screen.getByText(/starts at/i)).toBeInTheDocument()
    expect(mockTransition).not.toHaveBeenCalled()
  })

  it('does not auto-start a stale draft scheduled session whose scheduledStart was on a previous calendar day (bounded window)', async () => {
    jest.useFakeTimers({ now: new Date('2026-07-18T09:00:00.000Z') })
    const staleDraft = makeSession({
      status: 'draft',
      timeChannelType: 'scheduled',
      scheduledStart: '2026-07-17T10:15:00.000Z',
      scheduledEnd: '2026-07-17T10:45:00.000Z',
      startedAt: null,
    })
    mockGetActive.mockResolvedValue(ok(staleDraft))

    renderNowCard()
    await act(async () => { await Promise.resolve() })
    await act(async () => { jest.advanceTimersByTime(30_000) })

    expect(mockTransition).not.toHaveBeenCalled()
  })
})

describe('NowCard — clock-driven end reminder (G9 item 1)', () => {
  it('shows a "time to finish" prompt when wall-clock time passes a running scheduled session\'s scheduledEnd, without auto-finalizing', async () => {
    jest.useFakeTimers({ now: new Date('2026-07-17T10:50:00.000Z') })
    const runningSession = makeSession({
      status: 'running',
      timeChannelType: 'scheduled',
      scheduledStart: '2026-07-17T10:15:00.000Z',
      scheduledEnd: '2026-07-17T10:45:00.000Z',
      elapsedSeconds: 1800,
    })
    mockGetActive.mockResolvedValue(ok(runningSession))

    renderNowCard()
    await act(async () => { await Promise.resolve() })

    await waitFor(() => expect(screen.getByTestId('now-card-running')).toBeInTheDocument())
    expect(screen.getByTestId('scheduled-end-reminder')).toBeInTheDocument()
    expect(mockTransition).not.toHaveBeenCalled()
    // Manual Finish/outcome flow is unchanged — the button is still there, nothing auto-finalized.
    expect(screen.getByTestId('finish-button')).toBeInTheDocument()
  })

  it('does not show the "time to finish" prompt before scheduledEnd has passed', async () => {
    jest.useFakeTimers({ now: new Date('2026-07-17T10:20:00.000Z') })
    const runningSession = makeSession({
      status: 'running',
      timeChannelType: 'scheduled',
      scheduledStart: '2026-07-17T10:15:00.000Z',
      scheduledEnd: '2026-07-17T10:45:00.000Z',
      elapsedSeconds: 300,
    })
    mockGetActive.mockResolvedValue(ok(runningSession))

    renderNowCard()
    await act(async () => { await Promise.resolve() })

    await waitFor(() => expect(screen.getByTestId('now-card-running')).toBeInTheDocument())
    expect(screen.queryByTestId('scheduled-end-reminder')).not.toBeInTheDocument()
  })
})

/**
 * UAT 4.5 — "Edit that lesson and give it its own time, e.g. 1:00 – 1:30 PM."
 *
 * Amir was blocked: "there is no place for editing the time." Step 4.5 follows
 * 4.4 (View Full Calendar), and every edit entry point outside the Dashboard
 * (Full Calendar, Planner grid, weekly view, mobile list) deep-links to
 * `/lessons?editId=<id>`, which opens the LessonCard inline editor — and that
 * editor has no time fields. Only the Dashboard modal (EditLessonModal →
 * LessonTaskForm) has them.
 *
 * Every test asserts on the *wire* form of the update (`JSON.parse(JSON.stringify(patch))`),
 * because that is what the PUT route sees: a key whose value is `undefined` never
 * reaches the server, and the route only touches a lesson's times when
 * `scheduledStartTime` is present in the body.
 */
import React from 'react'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

const mockPush = jest.fn()
let mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: jest.fn(), push: mockPush }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: {
    getLessons: jest.fn(),
    getLesson: jest.fn(),
    createLesson: jest.fn(),
    updateLesson: jest.fn(),
    deleteLesson: jest.fn(),
    completeLesson: jest.fn(),
  },
}))

jest.mock('@/features/household/front/context', () => ({ useHousehold: jest.fn() }))
jest.mock('@/features/layout/front/context/LearnerContext', () => ({ useLearner: jest.fn() }))

import { plannerApi } from '@/features/plan/front/services/api'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { LessonsPage } from '@/features/plan/front/pages/LessonsPage'
import { LessonCard } from '@/features/plan/front/components/LessonCard'
import { EditLessonModal } from '@/features/dashboard/front/components/EditLessonModal'
import { ScheduleTimeline } from '@/features/schedule/front/components/ScheduleTimeline'

const mockGetLessons = plannerApi.getLessons as jest.Mock
const mockGetLesson = plannerApi.getLesson as jest.Mock
const mockUpdateLesson = plannerApi.updateLesson as jest.Mock

const learners: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'adam', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]
const courses: SubjectCourse[] = [
  { id: 'subj_math', childId: 'child_001', name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' },
]

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** The UAT 4.2 lesson: today, Math, no start or end time of its own. */
function untimedLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'lesson_uat',
    childId: 'child_001',
    subjectId: 'subj_math',
    householdId: 'hh_001',
    title: 'Fractions review',
    dueDate: todayStr(),
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

/** What the PUT /api/plan/lessons/:id route will actually receive. */
function wireBodyOfLastUpdate(): Record<string, unknown> {
  const calls = mockUpdateLesson.mock.calls
  expect(calls.length).toBeGreaterThan(0)
  const [, patch] = calls[calls.length - 1]
  return JSON.parse(JSON.stringify(patch))
}

async function setTime(scope: HTMLElement, label: 'Start time' | 'End time', hour: string, minute: string, period: 'AM' | 'PM') {
  const user = userEvent.setup()
  await user.selectOptions(within(scope).getByLabelText(`${label} hour`), hour)
  await user.selectOptions(within(scope).getByLabelText(`${label} minute`), minute)
  await user.selectOptions(within(scope).getByLabelText(`${label} period`), period)
}

async function clearTime(scope: HTMLElement, label: 'Start time' | 'End time') {
  await userEvent.setup().selectOptions(within(scope).getByLabelText(`${label} hour`), '')
}

beforeEach(() => {
  ;(useHousehold as jest.Mock).mockImplementation(() => ({
    householdProfile: { id: 'hh_001' },
    studentProfiles: learners,
    allSubjects: courses,
    loading: false,
    needsSetup: false,
    familyName: '',
    error: null,
    refetch: jest.fn(),
  }))
  ;(useLearner as jest.Mock).mockImplementation(() => ({ selectedChildId: null, setSelectedChildId: jest.fn() }))
  mockGetLessons.mockResolvedValue([])
  mockUpdateLesson.mockResolvedValue(untimedLesson())
  mockSearchParams = new URLSearchParams()
})

afterEach(() => {
  jest.clearAllMocks()
})

// ─── How Amir got to the editor ──────────────────────────────────────────────

describe('UAT 4.4 → 4.5 — the Full Calendar edit pencil', () => {
  it('opens /lessons?editId=<id> (the inline LessonCard editor) when no modal handler is given', async () => {
    render(
      <ScheduleTimeline
        schedule={{
          date: todayStr(),
          entries: [
            {
              id: 'entry_1',
              kind: 'lesson',
              startTime: '10:15',
              endTime: '11:00',
              durationMinutes: 45,
              lesson: untimedLesson(),
            },
          ],
          blocks: [],
          isPaused: false,
        }}
        currentTime="09:00"
        subjects={courses}
        showAdjustDay={false}
      />,
    )
    await userEvent.setup().click(screen.getByRole('button', { name: /edit lesson/i }))
    expect(mockPush).toHaveBeenCalledWith('/lessons?editId=lesson_uat')
  })
})

// ─── Path 1: /lessons?editId= (Calendar, Planner grid, weekly view, mobile) ──

describe('UAT 4.5 — editing a lesson deep-linked from the Calendar or Planner', () => {
  function editorFor(id: string): HTMLElement {
    const el = document.querySelector(`[data-lesson-id="${id}"]`)
    expect(el).not.toBeNull()
    return el as HTMLElement
  }

  it('the inline editor that opens has Start time and End time fields', async () => {
    mockSearchParams = new URLSearchParams('editId=lesson_uat')
    mockGetLessons.mockResolvedValue([untimedLesson()])
    render(<LessonsPage />)

    await waitFor(() => expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument())
    const editor = editorFor('lesson_uat')
    expect(within(editor).getByLabelText('Start time hour')).toBeInTheDocument()
    expect(within(editor).getByLabelText('End time hour')).toBeInTheDocument()
  })

  it('giving it 1:00 – 1:30 PM saves scheduledStartTime 13:00 and scheduledEndTime 13:30', async () => {
    mockSearchParams = new URLSearchParams('editId=lesson_uat')
    mockGetLessons.mockResolvedValue([untimedLesson()])
    render(<LessonsPage />)

    await waitFor(() => expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument())
    const editor = editorFor('lesson_uat')
    await setTime(editor, 'Start time', '1', '00', 'PM')
    await setTime(editor, 'End time', '1', '30', 'PM')
    await userEvent.setup().click(within(editor).getByRole('button', { name: /save/i }))

    await waitFor(() => expect(mockUpdateLesson).toHaveBeenCalled())
    expect(mockUpdateLesson.mock.calls[0][0]).toBe('lesson_uat')
    expect(wireBodyOfLastUpdate()).toMatchObject({ scheduledStartTime: '13:00', scheduledEndTime: '13:30' })
  })
})

describe('LessonCard inline editor — lesson times', () => {
  function renderCard(lesson: LessonTask) {
    const onUpdate = jest.fn().mockResolvedValue(undefined)
    render(
      <LessonCard
        lesson={lesson}
        childName="Adam"
        subjectName="Math"
        children={learners}
        subjects={courses}
        onUpdate={onUpdate}
        defaultEditing
      />,
    )
    const editor = document.querySelector('[data-lesson-id]') as HTMLElement
    return { onUpdate, editor }
  }

  function wireBody(onUpdate: jest.Mock): Record<string, unknown> {
    expect(onUpdate).toHaveBeenCalled()
    return JSON.parse(JSON.stringify(onUpdate.mock.calls[0][1]))
  }

  it('pre-fills the lesson\'s own time', () => {
    const { editor } = renderCard(untimedLesson({ scheduledStartTime: '13:00', scheduledEndTime: '13:30' }))
    expect(within(editor).getByLabelText('Start time hour')).toHaveValue('1')
    expect(within(editor).getByLabelText('Start time period')).toHaveValue('PM')
    expect(within(editor).getByLabelText('End time minute')).toHaveValue('30')
  })

  it('leaves both pickers blank for a lesson with no time of its own', () => {
    const { editor } = renderCard(untimedLesson())
    expect(within(editor).getByLabelText('Start time hour')).toHaveValue('')
    expect(within(editor).getByLabelText('End time hour')).toHaveValue('')
  })

  it('rejects a start time without an end time and does not save', async () => {
    const { editor, onUpdate } = renderCard(untimedLesson())
    await setTime(editor, 'Start time', '1', '00', 'PM')
    await userEvent.setup().click(within(editor).getByRole('button', { name: /save/i }))
    expect(await within(editor).findByText(/enter both a start and end time/i)).toBeInTheDocument()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('rejects an end time before the start time and does not save', async () => {
    const { editor, onUpdate } = renderCard(untimedLesson())
    await setTime(editor, 'Start time', '2', '00', 'PM')
    await setTime(editor, 'End time', '1', '30', 'PM')
    await userEvent.setup().click(within(editor).getByRole('button', { name: /save/i }))
    expect(await within(editor).findByText(/end time must be after start time/i)).toBeInTheDocument()
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('clearing the lesson\'s own time sends null so it falls back to the course time', async () => {
    const { editor, onUpdate } = renderCard(untimedLesson({ scheduledStartTime: '13:00', scheduledEndTime: '13:30' }))
    await clearTime(editor, 'Start time')
    await clearTime(editor, 'End time')
    await userEvent.setup().click(within(editor).getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    expect(wireBody(onUpdate)).toMatchObject({ scheduledStartTime: null, scheduledEndTime: null })
  })

  it('saving an untimed lesson without touching the pickers does not invent a time', async () => {
    const { editor, onUpdate } = renderCard(untimedLesson())
    await userEvent.setup().click(within(editor).getByRole('button', { name: /save/i }))
    await waitFor(() => expect(onUpdate).toHaveBeenCalled())
    const body = wireBody(onUpdate)
    expect(body.scheduledStartTime ?? null).toBeNull()
    expect(body.scheduledEndTime ?? null).toBeNull()
  })
})

// ─── Path 2: Dashboard → Today's Schedule pencil (EditLessonModal) ────────────

describe('UAT 4.5 — editing from the Dashboard (EditLessonModal)', () => {
  async function openModal(lesson: LessonTask) {
    mockGetLesson.mockResolvedValue(lesson)
    render(<EditLessonModal lessonId={lesson.id} onClose={jest.fn()} onSaved={jest.fn()} />)
    return await screen.findByTestId('edit-lesson-modal')
  }

  it('giving it 1:00 – 1:30 PM saves scheduledStartTime 13:00 and scheduledEndTime 13:30', async () => {
    const modal = await openModal(untimedLesson())
    await waitFor(() => expect(within(modal).getByLabelText('Start time hour')).toBeInTheDocument())
    await setTime(modal, 'Start time', '1', '00', 'PM')
    await setTime(modal, 'End time', '1', '30', 'PM')
    await userEvent.setup().click(within(modal).getByRole('button', { name: /save|update/i }))
    await waitFor(() => expect(mockUpdateLesson).toHaveBeenCalled())
    expect(wireBodyOfLastUpdate()).toMatchObject({ scheduledStartTime: '13:00', scheduledEndTime: '13:30' })
  })

  it('clearing the lesson\'s own time sends null so it falls back to the course time', async () => {
    const modal = await openModal(untimedLesson({ scheduledStartTime: '13:00', scheduledEndTime: '13:30' }))
    await waitFor(() => expect(within(modal).getByLabelText('Start time hour')).toHaveValue('1'))
    await clearTime(modal, 'Start time')
    await clearTime(modal, 'End time')
    await userEvent.setup().click(within(modal).getByRole('button', { name: /save|update/i }))
    await waitFor(() => expect(mockUpdateLesson).toHaveBeenCalled())
    expect(wireBodyOfLastUpdate()).toMatchObject({ scheduledStartTime: null, scheduledEndTime: null })
  })
})

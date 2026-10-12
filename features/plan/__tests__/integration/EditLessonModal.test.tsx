import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { EditLessonModal } from '@/features/plan/front/components/EditLessonModal'
import type { LessonTask } from '@/features/plan/types'
import type { SubjectCourse } from '@/features/subjects/types'
import type { StudentProfile } from '@/features/lib/types'

/**
 * The one Edit lesson window, opened in place from the Dashboard, Calendar and Planner
 * (shared-lessons plan, D1–D3). Covers every state and every way a parent uses it.
 */

jest.mock('@/features/plan/front/services/api', () => ({
  plannerApi: { getLesson: jest.fn(), updateLesson: jest.fn(), deleteLesson: jest.fn() },
}))

const adam: StudentProfile = { id: 'child_001', householdId: 'hh_001', name: 'Adam', gradeLabel: '5th', isActive: true, username: 'a', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
const khadijah: StudentProfile = { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'k', password: 'pw', createdAt: '2026-01-01T00:00:00Z' }
const course = (id: string, name: string, learner: string): SubjectCourse =>
  ({ id, childId: learner, learnerIds: [learner], name, category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' })
const courses = [course('subj_a', 'Math 5', 'child_001'), course('subj_k', 'Math 3', 'child_002')]

jest.mock('@/features/household/front/context', () => ({
  useHousehold: () => ({
    householdProfile: { id: 'hh_001' }, studentProfiles: [adam, khadijah], allSubjects: courses,
    loading: false, needsSetup: false, familyName: '', error: null, refetch: jest.fn(),
  }),
}))

import { plannerApi } from '@/features/plan/front/services/api'
const mockGetLesson = plannerApi.getLesson as jest.Mock
const mockUpdate = plannerApi.updateLesson as jest.Mock
const mockDelete = plannerApi.deleteLesson as jest.Mock

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'lesson_1', childId: 'child_001', subjectId: 'subj_a', householdId: 'hh_001', title: 'Fractions',
    dueDate: '2026-10-14', status: 'not_started', order: 1, estimatedDuration: '30min',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...overrides,
  }
}

const onClose = jest.fn()
const onSaved = jest.fn()

beforeEach(() => {
  jest.clearAllMocks()
  mockGetLesson.mockResolvedValue(makeLesson())
  mockUpdate.mockResolvedValue(makeLesson())
  mockDelete.mockResolvedValue(1)
})

async function openWindow(lesson?: LessonTask) {
  if (lesson) mockGetLesson.mockResolvedValue(lesson)
  render(<EditLessonModal lessonId={lesson?.id ?? 'lesson_1'} onClose={onClose} onSaved={onSaved} />)
  const dialog = await screen.findByRole('dialog', { name: /edit lesson/i })
  await waitFor(() => expect(within(dialog).getByLabelText(/^title$/i)).toBeInTheDocument())
  return dialog
}

function save(dialog: HTMLElement) {
  fireEvent.click(within(dialog).getByRole('button', { name: /save changes/i }))
}

describe('EditLessonModal — states', () => {
  test('shows Loading… while the lesson loads', () => {
    mockGetLesson.mockReturnValue(new Promise(() => {}))
    render(<EditLessonModal lessonId="lesson_1" onClose={onClose} onSaved={onSaved} />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  test('says so when the lesson no longer exists', async () => {
    mockGetLesson.mockResolvedValue(null)
    render(<EditLessonModal lessonId="gone" onClose={onClose} onSaved={onSaved} />)
    expect(await screen.findByText(/could not find this lesson/i)).toBeInTheDocument()
  })

  test('says so when the lesson cannot load', async () => {
    mockGetLesson.mockRejectedValue(new Error('down'))
    render(<EditLessonModal lessonId="lesson_1" onClose={onClose} onSaved={onSaved} />)
    expect(await screen.findByText(/could not load this lesson/i)).toBeInTheDocument()
  })

  test('shows the lesson filled in', async () => {
    const dialog = await openWindow()
    expect(within(dialog).getByLabelText(/^title$/i)).toHaveValue('Fractions')
    expect(within(dialog).getByLabelText(/^learner$/i)).toHaveValue('child_001')
    expect(within(dialog).getByLabelText(/^course$/i)).toHaveValue('subj_a')
  })
})

describe('EditLessonModal — closing', () => {
  test('Escape closes without saving', async () => {
    await openWindow()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(onClose).toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('clicking outside closes without saving', async () => {
    await openWindow()
    fireEvent.click(screen.getByRole('presentation'))
    expect(onClose).toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('Cancel closes without saving', async () => {
    const dialog = await openWindow()
    fireEvent.click(within(dialog).getByRole('button', { name: /^cancel$/i }))
    expect(onClose).toHaveBeenCalled()
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  test('the title field has focus when the window opens', async () => {
    const dialog = await openWindow()
    await waitFor(() => expect(within(dialog).getByLabelText(/^title$/i)).toHaveFocus())
  })
})

describe('EditLessonModal — saving', () => {
  test('saves, tells the page to refresh, and closes', async () => {
    const dialog = await openWindow()
    fireEvent.change(within(dialog).getByLabelText(/^title$/i), { target: { value: 'Fractions review' } })
    save(dialog)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledWith('lesson_1', expect.objectContaining({ title: 'Fractions review' })))
    expect(onSaved).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  test("shows the server's reason and stays open when a save is refused", async () => {
    mockUpdate.mockRejectedValue(new Error("Math 3 is not one of this learner's courses."))
    const dialog = await openWindow()
    save(dialog)
    expect(await within(dialog).findByText(/math 3 is not one of this learner's courses/i)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
    expect(onSaved).not.toHaveBeenCalled()
  })

  test('clearing optional details and unticking boxes is saved (not silently kept)', async () => {
    const dialog = await openWindow(makeLesson({
      description: 'Pages 10-12', resourceLink: 'https://example.com', curriculum: 'Saxon', chapter: 'Ch 3',
      hasHomework: true, hasAssessment: true,
    }))
    for (const label of [/^description/i, /^resource link/i, /^curriculum/i, /^chapter/i]) {
      fireEvent.change(within(dialog).getByLabelText(label), { target: { value: '' } })
    }
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Has homework' }))
    fireEvent.click(within(dialog).getByRole('checkbox', { name: 'Has assessment' }))
    save(dialog)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({
      description: '', resourceLink: '', curriculum: '', chapter: '', hasHomework: false, hasAssessment: false,
    })
  })
})

describe('EditLessonModal — shared lessons', () => {
  const shared = makeLesson({ groupId: 'group_1' })

  test('details go to every learner by default; date and time stay with this learner', async () => {
    const dialog = await openWindow(shared)
    expect(within(dialog).getByRole('checkbox', { name: /apply to all learners in group/i })).toBeChecked()
    expect(within(dialog).getByRole('checkbox', { name: /move the date and time for every learner/i })).not.toBeChecked()
    expect(within(dialog).getByText(/date and time change for adam only/i)).toBeInTheDocument()
    save(dialog)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({ applyToGroup: true })
    expect(mockUpdate.mock.calls[0][1].applyScheduleToGroup).toBeUndefined()
  })

  test('"Also move the date and time for every learner" is sent when ticked', async () => {
    const dialog = await openWindow(shared)
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /move the date and time for every learner/i }))
    save(dialog)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({ applyToGroup: true, applyScheduleToGroup: true })
  })

  test('unticking the group box edits only this learner', async () => {
    const dialog = await openWindow(shared)
    fireEvent.click(within(dialog).getByRole('checkbox', { name: /apply to all learners in group/i }))
    expect(within(dialog).queryByRole('checkbox', { name: /move the date and time/i })).not.toBeInTheDocument()
    save(dialog)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(mockUpdate.mock.calls[0][1].applyToGroup).toBeUndefined()
    expect(mockUpdate.mock.calls[0][1].applyScheduleToGroup).toBeUndefined()
  })

  test('no group boxes on a lesson for one learner', async () => {
    const dialog = await openWindow()
    expect(within(dialog).queryByRole('checkbox', { name: /apply to all learners in group/i })).not.toBeInTheDocument()
  })
})

describe('EditLessonModal — moving to another learner or course', () => {
  test('moves the lesson to Khadijah and one of her courses', async () => {
    const dialog = await openWindow()
    fireEvent.change(within(dialog).getByLabelText(/^learner$/i), { target: { value: 'child_002' } })
    const courseSelect = within(dialog).getByLabelText(/^course$/i) as HTMLSelectElement
    expect(Array.from(courseSelect.options).map(o => o.value)).toEqual(['', 'subj_k'])
    fireEvent.change(courseSelect, { target: { value: 'subj_k' } })
    save(dialog)
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled())
    expect(mockUpdate.mock.calls[0][1]).toMatchObject({ childId: 'child_002', subjectId: 'subj_k' })
  })

  test('asks for a course after switching learner, and saves nothing until one is chosen', async () => {
    const dialog = await openWindow()
    fireEvent.change(within(dialog).getByLabelText(/^learner$/i), { target: { value: 'child_002' } })
    save(dialog)
    expect(await within(dialog).findByText(/choose a course for khadijah/i)).toBeInTheDocument()
    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

describe('EditLessonModal — delete', () => {
  test('a lesson for one learner: Delete → confirm → deleted, page refreshes, window closes', async () => {
    const dialog = await openWindow()
    fireEvent.click(within(dialog).getByRole('button', { name: /delete this lesson/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }))
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('lesson_1', { deleteGroup: false }))
    expect(onSaved).toHaveBeenCalled()
    expect(onClose).toHaveBeenCalled()
  })

  test('a shared lesson: "Just Adam" deletes only this copy', async () => {
    const dialog = await openWindow(makeLesson({ groupId: 'group_1' }))
    fireEvent.click(within(dialog).getByRole('button', { name: /delete this lesson/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'Just Adam' }))
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('lesson_1', { deleteGroup: false }))
  })

  test('a shared lesson: "All learners in this group" deletes every copy', async () => {
    const dialog = await openWindow(makeLesson({ groupId: 'group_1' }))
    fireEvent.click(within(dialog).getByRole('button', { name: /delete this lesson/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: 'All learners in this group' }))
    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith('lesson_1', { deleteGroup: true }))
  })

  test('Cancel on the confirmation goes back to the form; nothing deleted', async () => {
    const dialog = await openWindow()
    fireEvent.click(within(dialog).getByRole('button', { name: /delete this lesson/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: /^cancel$/i }))
    expect(mockDelete).not.toHaveBeenCalled()
    expect(within(dialog).getByLabelText(/^title$/i)).toBeInTheDocument()
    expect(onClose).not.toHaveBeenCalled()
  })

  test('a failed delete shows why and keeps the window open', async () => {
    mockDelete.mockRejectedValue(new Error('Lesson not found'))
    const dialog = await openWindow()
    fireEvent.click(within(dialog).getByRole('button', { name: /delete this lesson/i }))
    fireEvent.click(within(dialog).getByRole('button', { name: /^delete$/i }))
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Lesson not found')
    expect(onClose).not.toHaveBeenCalled()
  })
})

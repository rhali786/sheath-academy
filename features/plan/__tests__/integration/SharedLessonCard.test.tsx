import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { SharedLessonCard } from '@/features/plan/front/components/SharedLessonCard'
import type { LessonTask } from '@/features/plan/types'
import type { StudentProfile } from '@/features/lib/types'
import type { SubjectCourse } from '@/features/subjects/types'

/**
 * "Show me what I planned this week": a lesson shared by several learners is one card with
 * a chip per learner and that learner's status, instead of one near-identical card each.
 */

const kid = (id: string, name: string): StudentProfile =>
  ({ id, householdId: 'hh_001', name, gradeLabel: '5th', isActive: true, username: id, password: 'pw', createdAt: '2026-01-01T00:00:00Z' })
const kids = [kid('c1', 'Adam'), kid('c2', 'Khadijah'), kid('c3', 'Yusuf')]
const course = (id: string, learner: string): SubjectCourse =>
  ({ id, childId: learner, learnerIds: [learner], name: 'Math', category: 'Math', isActive: true, order: 1, createdAt: '2026-01-01T00:00:00Z' })
const courses = [course('s1', 'c1'), course('s2', 'c2'), course('s3', 'c3')]

function copy(id: string, childId: string, subjectId: string, overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id, childId, subjectId, householdId: 'hh_001', groupId: 'g1', title: 'Fractions', dueDate: '2099-10-14',
    status: 'not_started', order: 1, createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...overrides,
  }
}
const copies = [copy('l1', 'c1', 's1', { status: 'completed' }), copy('l2', 'c2', 's2'), copy('l3', 'c3', 's3', { status: 'skipped' })]

const handlers = () => ({
  onUpdate: jest.fn().mockResolvedValue(undefined),
  onDelete: jest.fn().mockResolvedValue(undefined),
  onComplete: jest.fn().mockResolvedValue(undefined),
})

function renderCard(list = copies, h = handlers(), editingLessonId: string | null = null) {
  render(<SharedLessonCard copies={list} children={kids} subjects={courses} {...h} editingLessonId={editingLessonId} />)
  return h
}

describe('SharedLessonCard — collapsed', () => {
  test('shows the lesson once, how many learners share it, and a chip per learner with their status', () => {
    renderCard()
    expect(screen.getAllByText('Fractions')).toHaveLength(1)
    expect(screen.getByText(/3 learners/i)).toBeInTheDocument()
    const chips = screen.getByRole('list', { name: /learners/i })
    expect(within(chips).getByText('Adam')).toBeInTheDocument()
    expect(within(chips).getByLabelText('Adam: Completed')).toBeInTheDocument()
    expect(within(chips).getByLabelText('Khadijah: Not started')).toBeInTheDocument()
    expect(within(chips).getByLabelText('Yusuf: Skipped')).toBeInTheDocument()
  })

  test('marks an overdue learner as Overdue', () => {
    renderCard([copy('l1', 'c1', 's1', { dueDate: '2020-01-06' }), copy('l2', 'c2', 's2', { dueDate: '2020-01-06', status: 'completed' })])
    expect(screen.getByLabelText('Adam: Overdue')).toBeInTheDocument()
    expect(screen.getByLabelText('Khadijah: Completed')).toBeInTheDocument()
  })

  test('shows one date when every copy is on the same day, and a range when they differ', () => {
    const { unmount } = render(<SharedLessonCard copies={copies} children={kids} subjects={courses} {...handlers()} />)
    const single = screen.getByTestId('shared-lesson-date').textContent ?? ''
    expect(single).toContain('Oct 14')
    expect(single).not.toContain('–')
    unmount()
    renderCard([copy('l1', 'c1', 's1', { dueDate: '2099-10-14' }), copy('l2', 'c2', 's2', { dueDate: '2099-10-16' })])
    expect(screen.getByTestId('shared-lesson-date').textContent).toMatch(/Oct 14 – .*Oct 16/)
  })

  test('learners are not listed as separate cards until expanded', () => {
    renderCard()
    expect(document.querySelector('[data-lesson-id="l2"]')).toBeNull()
  })
})

describe('SharedLessonCard — expanded', () => {
  test('"Show learners" lists each learner\'s own lesson; "Hide learners" collapses again', () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: /show learners/i }))
    for (const id of ['l1', 'l2', 'l3']) expect(document.querySelector(`[data-lesson-id="${id}"]`)).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: /hide learners/i }))
    expect(document.querySelector('[data-lesson-id="l2"]')).toBeNull()
  })

  test("marking one learner done marks only that learner's copy", async () => {
    const h = renderCard()
    fireEvent.click(screen.getByRole('button', { name: /show learners/i }))
    const khadijah = document.querySelector('[data-lesson-id="l2"]') as HTMLElement
    fireEvent.click(within(khadijah).getByRole('button', { name: /mark lesson done/i }))
    await waitFor(() => expect(h.onComplete).toHaveBeenCalledWith('l2', 'completed'))
    expect(h.onComplete).toHaveBeenCalledTimes(1)
  })

  test('deleting just one learner from the expanded list keeps the others', async () => {
    const h = renderCard()
    fireEvent.click(screen.getByRole('button', { name: /show learners/i }))
    const khadijah = document.querySelector('[data-lesson-id="l2"]') as HTMLElement
    fireEvent.click(within(khadijah).getByRole('button', { name: /delete lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: 'Just Khadijah' }))
    await waitFor(() => expect(h.onDelete).toHaveBeenCalledWith('l2', { deleteGroup: false }))
  })
})

describe('SharedLessonCard — edit and delete the whole lesson', () => {
  test('Edit opens the editor with "apply to all learners" ticked', () => {
    renderCard()
    fireEvent.click(screen.getByRole('button', { name: /edit shared lesson/i }))
    expect(screen.getByRole('checkbox', { name: /apply to all learners in group/i })).toBeChecked()
    expect(screen.getByRole('button', { name: /save lesson/i })).toBeInTheDocument()
  })

  test('a rename from the shared card is saved for every learner', async () => {
    const h = renderCard()
    fireEvent.click(screen.getByRole('button', { name: /edit shared lesson/i }))
    fireEvent.change(screen.getByDisplayValue('Fractions'), { target: { value: 'Fractions review' } })
    fireEvent.click(screen.getByRole('button', { name: /save lesson/i }))
    await waitFor(() => expect(h.onUpdate).toHaveBeenCalledWith('l1', expect.objectContaining({ title: 'Fractions review', applyToGroup: true })))
  })

  test('Delete asks once and deletes every learner\'s copy', async () => {
    const h = renderCard()
    fireEvent.click(screen.getByRole('button', { name: /delete shared lesson/i }))
    expect(screen.getByText(/delete “fractions” for all 3 learners\?/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /delete for all 3/i }))
    await waitFor(() => expect(h.onDelete).toHaveBeenCalledWith('l1', { deleteGroup: true }))
  })

  test('Cancel on delete keeps the lesson', () => {
    const h = renderCard()
    fireEvent.click(screen.getByRole('button', { name: /delete shared lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: /^cancel$/i }))
    expect(h.onDelete).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: /delete shared lesson/i })).toBeInTheDocument()
  })

  test('a failed delete shows why', async () => {
    const h = handlers()
    h.onDelete.mockRejectedValue(new Error('Lesson not found'))
    renderCard(copies, h)
    fireEvent.click(screen.getByRole('button', { name: /delete shared lesson/i }))
    fireEvent.click(screen.getByRole('button', { name: /delete for all 3/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Lesson not found')
  })
})

describe('SharedLessonCard — deep link', () => {
  test("a link to one learner's copy opens expanded with that copy's editor", () => {
    renderCard(copies, handlers(), 'l2')
    const khadijah = document.querySelector('[data-lesson-id="l2"]') as HTMLElement
    expect(within(khadijah).getByRole('button', { name: /save lesson/i })).toBeInTheDocument()
  })
})

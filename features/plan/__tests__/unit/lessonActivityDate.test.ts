import { getLessonActivityDate } from '@/features/plan/utils/lessonActivityDate'
import type { LessonTask } from '@/features/plan/types'

function lesson(overrides: Partial<LessonTask> & Pick<LessonTask, 'id'>): LessonTask {
  return {
    childId: 'child_1',
    subjectId: 'sub_1',
    householdId: 'hh_1',
    title: 'Task',
    dueDate: '2026-05-10',
    status: 'completed',
    order: 0,
    createdAt: '2026-05-23T12:00:00.000Z',
    updatedAt: '2026-05-23T12:00:00.000Z',
    ...overrides,
  }
}

describe('getLessonActivityDate', () => {
  it('prefers completedAt over dueDate and updatedAt', () => {
    expect(
      getLessonActivityDate(
        lesson({
          id: '1',
          completedAt: '2026-05-12T15:00:00.000Z',
          dueDate: '2026-05-10',
          updatedAt: '2026-05-23T12:00:00.000Z',
        }),
      ),
    ).toBe('2026-05-12')
  })

  it('falls back to dueDate when completedAt is missing', () => {
    expect(getLessonActivityDate(lesson({ id: '2', dueDate: '2026-05-08' }))).toBe('2026-05-08')
  })

  it('falls back to updatedAt when no completion or due date', () => {
    expect(
      getLessonActivityDate(
        lesson({ id: '3', dueDate: '', updatedAt: '2026-05-01T08:00:00.000Z' }),
      ),
    ).toBe('2026-05-01')
  })
})

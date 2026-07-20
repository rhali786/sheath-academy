import { selectDayLessons } from '@/features/dashboard/front/lib/selectDayLessons'
import type { LessonTask } from '@/features/plan/types'

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'l1',
    childId: 'c1',
    subjectId: 's1',
    householdId: 'h1',
    title: 'Lesson',
    dueDate: '2026-07-15',
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('selectDayLessons', () => {
  test('a single-day lesson (no plannedStartDate) appears only on its due date', () => {
    const lesson = makeLesson({ dueDate: '2026-07-15' })
    expect(selectDayLessons([lesson], '2026-07-15')).toEqual([lesson])
    expect(selectDayLessons([lesson], '2026-07-14')).toEqual([])
    expect(selectDayLessons([lesson], '2026-07-16')).toEqual([])
  })

  test('a lesson spanning Mon (plannedStartDate) through Wed (dueDate) appears on all three days', () => {
    const lesson = makeLesson({ plannedStartDate: '2026-07-13', dueDate: '2026-07-15' })
    expect(selectDayLessons([lesson], '2026-07-13')).toEqual([lesson])
    expect(selectDayLessons([lesson], '2026-07-14')).toEqual([lesson])
    expect(selectDayLessons([lesson], '2026-07-15')).toEqual([lesson])
  })

  test('a spanning lesson does not appear before its window or after its due date', () => {
    const lesson = makeLesson({ plannedStartDate: '2026-07-13', dueDate: '2026-07-15' })
    expect(selectDayLessons([lesson], '2026-07-12')).toEqual([])
    expect(selectDayLessons([lesson], '2026-07-16')).toEqual([])
  })

  test('sorts results by order', () => {
    const a = makeLesson({ id: 'a', order: 2 })
    const b = makeLesson({ id: 'b', order: 1 })
    expect(selectDayLessons([a, b], '2026-07-15').map(l => l.id)).toEqual(['b', 'a'])
  })
})

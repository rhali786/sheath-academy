import { getCompletedLessonHistory } from '@/features/planner/utils/completedLessonHistory'
import type { LessonTask } from '@/features/planner/types'

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'l1',
    childId: 'child_a',
    subjectId: 'subj_math',
    householdId: 'hh_1',
    title: 'Lesson',
    dueDate: '2026-05-12',
    status: 'completed',
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('getCompletedLessonHistory', () => {
  it('default returns only completed lessons', () => {
    const lessons = [
      makeLesson({ id: 'l1', status: 'completed' }),
      makeLesson({ id: 'l2', status: 'not_started' }),
    ]
    const result = getCompletedLessonHistory(lessons)
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('l1')
  })

  it('sorts newest first by dueDate', () => {
    const lessons = [
      makeLesson({ id: 'older', dueDate: '2026-05-10', status: 'completed' }),
      makeLesson({ id: 'newer', dueDate: '2026-05-15', status: 'completed' }),
      makeLesson({ id: 'middle', dueDate: '2026-05-12', status: 'completed' }),
    ]
    const result = getCompletedLessonHistory(lessons)
    expect(result.map(l => l.id)).toEqual(['newer', 'middle', 'older'])
  })

  it('filters by childId', () => {
    const lessons = [
      makeLesson({ id: 'l1', childId: 'child_a', status: 'completed' }),
      makeLesson({ id: 'l2', childId: 'child_b', status: 'completed' }),
    ]
    const result = getCompletedLessonHistory(lessons, { childId: 'child_a' })
    expect(result).toHaveLength(1)
    expect(result[0].childId).toBe('child_a')
  })

  it('filters by subjectId', () => {
    const lessons = [
      makeLesson({ id: 'l1', subjectId: 'subj_math', status: 'completed' }),
      makeLesson({ id: 'l2', subjectId: 'subj_quran', status: 'completed' }),
    ]
    const result = getCompletedLessonHistory(lessons, { subjectId: 'subj_math' })
    expect(result).toHaveLength(1)
    expect(result[0].subjectId).toBe('subj_math')
  })

  it('filters by startDate', () => {
    const lessons = [
      makeLesson({ id: 'before', dueDate: '2026-05-01', status: 'completed' }),
      makeLesson({ id: 'after', dueDate: '2026-05-15', status: 'completed' }),
    ]
    const result = getCompletedLessonHistory(lessons, { startDate: '2026-05-10' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('after')
  })

  it('filters by endDate', () => {
    const lessons = [
      makeLesson({ id: 'before', dueDate: '2026-05-01', status: 'completed' }),
      makeLesson({ id: 'after', dueDate: '2026-05-15', status: 'completed' }),
    ]
    const result = getCompletedLessonHistory(lessons, { endDate: '2026-05-10' })
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('before')
  })

  it('returns pending lessons when showPending is true', () => {
    const lessons = [
      makeLesson({ id: 'done', status: 'completed' }),
      makeLesson({ id: 'todo', status: 'not_started' }),
    ]
    const result = getCompletedLessonHistory(lessons, { showPending: true })
    expect(result.some(l => l.id === 'todo')).toBe(true)
  })

  it('returns all lessons when showAll is true', () => {
    const lessons = [
      makeLesson({ id: 'done', status: 'completed' }),
      makeLesson({ id: 'todo', status: 'not_started' }),
    ]
    const result = getCompletedLessonHistory(lessons, { showAll: true })
    expect(result).toHaveLength(2)
  })

  it('respects the limit option', () => {
    const lessons = Array.from({ length: 10 }, (_, i) =>
      makeLesson({ id: `l${i}`, dueDate: `2026-05-${String(i + 1).padStart(2, '0')}`, status: 'completed' })
    )
    const result = getCompletedLessonHistory(lessons, { limit: 3 })
    expect(result).toHaveLength(3)
  })

  it('returns empty array when no lessons match', () => {
    const lessons = [makeLesson({ status: 'not_started' })]
    const result = getCompletedLessonHistory(lessons)
    expect(result).toEqual([])
  })
})

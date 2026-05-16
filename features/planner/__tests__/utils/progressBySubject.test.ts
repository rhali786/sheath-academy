import { computeProgressBySubject } from '@/features/planner/utils/progressBySubject'
import type { LessonTask } from '@/features/lib/types'

function makeLesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'l1',
    childId: 'child_a',
    subjectId: 'subj_math',
    householdId: 'hh_1',
    title: 'Lesson',
    dueDate: '2026-05-12',
    isCompleted: false,
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const WEEK = { start: '2026-05-11', end: '2026-05-17' }
const YEAR = { start: '2025-08-01', end: '2026-05-31' }

const NAMES = {
  children: { child_a: 'Adam', child_b: 'Khadijah' },
  subjects: { subj_math: 'Math', subj_quran: 'Quran' },
}

describe('computeProgressBySubject', () => {
  it('returns empty array when no lessons exist', () => {
    const result = computeProgressBySubject([], WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(result).toEqual([])
  })

  it('filters lessons outside the date range', () => {
    const lessons = [makeLesson({ dueDate: '2026-04-01' })]
    const result = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(result).toEqual([])
  })

  it('includes lessons within the date range', () => {
    const lessons = [makeLesson({ dueDate: '2026-05-12' })]
    const result = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(result).toHaveLength(1)
  })

  it('counts completed and pending correctly', () => {
    const lessons = [
      makeLesson({ id: 'l1', dueDate: '2026-05-12', isCompleted: true }),
      makeLesson({ id: 'l2', dueDate: '2026-05-13', isCompleted: true }),
      makeLesson({ id: 'l3', dueDate: '2026-05-14', isCompleted: false }),
    ]
    const [row] = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(row.plannedCount).toBe(3)
    expect(row.completedCount).toBe(2)
    expect(row.pendingCount).toBe(1)
  })

  it('calculates completionRate safely when plannedCount is zero', () => {
    const result = computeProgressBySubject([], WEEK, null, NAMES.children, NAMES.subjects, 'week')
    // No rows → no division error
    expect(result).toEqual([])
  })

  it('completionRate is 0 when no lessons completed', () => {
    const lessons = [makeLesson({ dueDate: '2026-05-12', isCompleted: false })]
    const [row] = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(row.completionRate).toBe(0)
  })

  it('completionRate is 1 when all completed', () => {
    const lessons = [makeLesson({ dueDate: '2026-05-12', isCompleted: true })]
    const [row] = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(row.completionRate).toBe(1)
  })

  it('filters by childIdFilter when provided', () => {
    const lessons = [
      makeLesson({ id: 'l1', childId: 'child_a', dueDate: '2026-05-12' }),
      makeLesson({ id: 'l2', childId: 'child_b', dueDate: '2026-05-12' }),
    ]
    const result = computeProgressBySubject(lessons, WEEK, ['child_a'], NAMES.children, NAMES.subjects, 'week')
    expect(result).toHaveLength(1)
    expect(result[0].childId).toBe('child_a')
  })

  it('includes all children when childIdFilter is null', () => {
    const lessons = [
      makeLesson({ id: 'l1', childId: 'child_a', dueDate: '2026-05-12' }),
      makeLesson({ id: 'l2', childId: 'child_b', dueDate: '2026-05-12' }),
    ]
    const result = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    const childIds = result.map(r => r.childId)
    expect(childIds).toContain('child_a')
    expect(childIds).toContain('child_b')
  })

  it('groups by child+subject producing separate rows', () => {
    const lessons = [
      makeLesson({ id: 'l1', childId: 'child_a', subjectId: 'subj_math', dueDate: '2026-05-12' }),
      makeLesson({ id: 'l2', childId: 'child_a', subjectId: 'subj_quran', dueDate: '2026-05-12' }),
      makeLesson({ id: 'l3', childId: 'child_b', subjectId: 'subj_math', dueDate: '2026-05-12' }),
    ]
    const result = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(result).toHaveLength(3)
  })

  it('resolves child and subject names', () => {
    const lessons = [makeLesson({ dueDate: '2026-05-12' })]
    const [row] = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(row.childName).toBe('Adam')
    expect(row.subjectName).toBe('Math')
  })

  it('falls back to id when name not found', () => {
    const lessons = [makeLesson({ childId: 'unknown_child', subjectId: 'unknown_subj', dueDate: '2026-05-12' })]
    const [row] = computeProgressBySubject(lessons, WEEK, null, {}, {}, 'week')
    expect(row.childName).toBe('unknown_child')
    expect(row.subjectName).toBe('unknown_subj')
  })

  it('attaches the scope to each row', () => {
    const lessons = [makeLesson({ dueDate: '2026-05-12' })]
    const [row] = computeProgressBySubject(lessons, WEEK, null, NAMES.children, NAMES.subjects, 'week')
    expect(row.scope).toBe('week')
  })

  it('works correctly over school-year date range', () => {
    const lessons = [
      makeLesson({ id: 'l1', dueDate: '2025-09-01', isCompleted: true }),
      makeLesson({ id: 'l2', dueDate: '2026-03-15', isCompleted: false }),
      makeLesson({ id: 'l3', dueDate: '2026-07-01' }), // outside year
    ]
    const [row] = computeProgressBySubject(lessons, YEAR, null, NAMES.children, NAMES.subjects, 'year')
    expect(row.plannedCount).toBe(2)
    expect(row.scope).toBe('year')
  })
})

import { matchesStatusFilter } from '@/features/plan/utils/lessonStatusFilter'
import type { LessonTask } from '@/features/plan/types'

function lesson(overrides: Partial<LessonTask> & Pick<LessonTask, 'id'>): LessonTask {
  return {
    childId: 'child_1',
    subjectId: 'sub_1',
    householdId: 'hh_1',
    title: 'Task',
    dueDate: '2026-05-10',
    status: 'not_started',
    order: 0,
    createdAt: '2026-05-23T12:00:00.000Z',
    updatedAt: '2026-05-23T12:00:00.000Z',
    ...overrides,
  }
}

const TODAY = '2026-05-15'

describe('matchesStatusFilter', () => {
  it('with no filter, matches every lesson regardless of status', () => {
    expect(matchesStatusFilter(lesson({ id: '1', status: 'not_started' }), '', TODAY)).toBe(true)
    expect(matchesStatusFilter(lesson({ id: '2', status: 'completed' }), '', TODAY)).toBe(true)
  })

  it('with a real status filter, matches by exact status equality (unchanged behavior)', () => {
    expect(matchesStatusFilter(lesson({ id: '1', status: 'completed' }), 'completed', TODAY)).toBe(true)
    expect(matchesStatusFilter(lesson({ id: '2', status: 'not_started' }), 'completed', TODAY)).toBe(false)
  })

  describe('overdue (item 25 — derived, not a persisted status)', () => {
    it('a not_started lesson due yesterday matches', () => {
      const l = lesson({ id: '1', status: 'not_started', dueDate: '2026-05-14' })
      expect(matchesStatusFilter(l, 'overdue', TODAY)).toBe(true)
    })

    it('a not_started lesson due tomorrow does not match', () => {
      const l = lesson({ id: '1', status: 'not_started', dueDate: '2026-05-16' })
      expect(matchesStatusFilter(l, 'overdue', TODAY)).toBe(false)
    })

    it('a completed lesson due yesterday does not match', () => {
      const l = lesson({ id: '1', status: 'completed', dueDate: '2026-05-14' })
      expect(matchesStatusFilter(l, 'overdue', TODAY)).toBe(false)
    })

    it('a not_started lesson due today does not match (not overdue until past due)', () => {
      const l = lesson({ id: '1', status: 'not_started', dueDate: TODAY })
      expect(matchesStatusFilter(l, 'overdue', TODAY)).toBe(false)
    })

    it('a skipped lesson due yesterday does not match', () => {
      const l = lesson({ id: '1', status: 'skipped', dueDate: '2026-05-14' })
      expect(matchesStatusFilter(l, 'overdue', TODAY)).toBe(false)
    })
  })
})

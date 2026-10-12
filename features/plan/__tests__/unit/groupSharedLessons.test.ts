import { groupSharedLessons } from '@/features/plan/utils/groupSharedLessons'
import type { LessonTask } from '@/features/plan/types'

function lesson(id: string, groupId?: string, childId = 'c1'): LessonTask {
  return {
    id, childId, subjectId: 's1', householdId: 'h1', title: id, dueDate: '2026-10-14', status: 'not_started', order: 1,
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z', ...(groupId ? { groupId } : {}),
  }
}

describe('groupSharedLessons', () => {
  it('collapses copies of a shared lesson into one item', () => {
    const items = groupSharedLessons([lesson('a', 'g1', 'c1'), lesson('b', 'g1', 'c2'), lesson('c', 'g1', 'c3')])
    expect(items).toHaveLength(1)
    expect(items[0]).toMatchObject({ kind: 'shared', groupId: 'g1' })
    expect(items[0].kind === 'shared' && items[0].copies.map(l => l.id)).toEqual(['a', 'b', 'c'])
  })

  it('keeps list order: a shared lesson sits where its first copy was', () => {
    const items = groupSharedLessons([lesson('x'), lesson('a', 'g1', 'c1'), lesson('y'), lesson('b', 'g1', 'c2')])
    expect(items.map(i => (i.kind === 'single' ? i.lesson.id : i.groupId))).toEqual(['x', 'g1', 'y'])
  })

  it('a shared lesson with only one copy in view is an ordinary lesson (e.g. one learner selected)', () => {
    const items = groupSharedLessons([lesson('a', 'g1', 'c1'), lesson('z')])
    expect(items.map(i => i.kind)).toEqual(['single', 'single'])
  })

  it('lessons without a group are never merged, even with the same title', () => {
    const items = groupSharedLessons([lesson('a'), lesson('a2')])
    expect(items).toHaveLength(2)
  })

  it('keeps two different shared lessons apart', () => {
    const items = groupSharedLessons([lesson('a', 'g1', 'c1'), lesson('b', 'g2', 'c1'), lesson('c', 'g1', 'c2'), lesson('d', 'g2', 'c2')])
    expect(items.map(i => i.kind === 'shared' && i.groupId)).toEqual(['g1', 'g2'])
  })

  it('empty in, empty out', () => {
    expect(groupSharedLessons([])).toEqual([])
  })
})

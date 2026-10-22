import { buildDailySchedule } from '@/features/schedule/server/service'
import { groupTimelineEntries } from '@/features/schedule/lib/groupTimelineEntries'
import type { LessonTask } from '@/features/plan/types'

function lesson(id: string, childId: string, overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id, childId, subjectId: 's1', householdId: 'hh', title: id, dueDate: '2026-10-13',
    status: 'not_started', order: 0, estimatedDuration: '30min',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const SETTINGS = { startTime: '08:30', transitionMinutes: 10, defaultDurationMinutes: 30, includeSyntheticBreaks: true }

describe('groupTimelineEntries', () => {
  it('collapses copies of a shared lesson at the same time into one row, in place', () => {
    const schedule = buildDailySchedule([
      lesson('a', 'c1', { groupId: 'g1' }),
      lesson('b', 'c2', { groupId: 'g1' }),
    ], SETTINGS)
    const items = groupTimelineEntries(schedule.entries)
    const lessonItems = items.filter(i => i.entry.kind === 'lesson')
    expect(lessonItems).toHaveLength(1)
    expect(lessonItems[0].copies.map(c => c.lesson.childId)).toEqual(['c1', 'c2'])
  })

  it('keeps copies of a shared lesson apart when they are at different times', () => {
    const schedule = buildDailySchedule([
      lesson('a', 'c1', { groupId: 'g1', scheduledStartTime: '09:00', scheduledEndTime: '09:30' }),
      lesson('b', 'c2', { groupId: 'g1', scheduledStartTime: '13:00', scheduledEndTime: '13:30' }),
    ], SETTINGS)
    const lessonItems = groupTimelineEntries(schedule.entries).filter(i => i.entry.kind === 'lesson')
    expect(lessonItems).toHaveLength(2)
    expect(lessonItems.map(i => i.copies.length)).toEqual([1, 1])
  })

  it('leaves ordinary lessons and breaks as their own rows', () => {
    const schedule = buildDailySchedule([lesson('a', 'c1'), lesson('b', 'c2')], SETTINGS)
    const items = groupTimelineEntries(schedule.entries)
    expect(items).toHaveLength(schedule.entries.length)
    expect(items.filter(i => i.entry.kind !== 'lesson').every(i => i.copies.length === 0)).toBe(true)
  })
})

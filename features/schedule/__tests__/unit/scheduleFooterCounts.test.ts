import { getScheduleFooterCounts } from '@/features/schedule/lib/scheduleFooterCounts'
import type { ScheduleEntry } from '@/features/schedule/types'
import type { LessonTask } from '@/features/plan/types'

function lessonEntry(status: LessonTask['status']): ScheduleEntry {
  return {
    kind: 'lesson',
    id: 'block_l1',
    lesson: {
      id: 'l1',
      childId: 'c1',
      subjectId: 's1',
      householdId: 'h1',
      title: 'Math',
      dueDate: '2026-05-24',
      status,
      order: 1,
      createdAt: '',
      updatedAt: '',
    },
    startTime: '08:30',
    endTime: '09:00',
    durationMinutes: 30,
  }
}

describe('getScheduleFooterCounts', () => {
  test('counts lessons and breaks separately', () => {
    const entries: ScheduleEntry[] = [
      lessonEntry('completed'),
      lessonEntry('not_started'),
      { kind: 'break', id: 'b1', title: 'Break', startTime: '10:30', endTime: '10:45', durationMinutes: 15 },
    ]
    expect(getScheduleFooterCounts(entries)).toEqual({ scheduledCount: 2, plannedCount: 3 })
  })
})

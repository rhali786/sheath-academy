import { computeTaskMetrics } from '@/features/dashboard/server/taskMetrics'
import type { LessonTask } from '@/features/plan/types'

function lesson(overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id: 'l1',
    childId: 'c1',
    subjectId: 's1',
    householdId: 'hh1',
    title: 'Math',
    dueDate: '2026-05-24',
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

describe('computeTaskMetrics', () => {
  test('returns zero counts when nothing is done today', () => {
    const result = computeTaskMetrics({
      today: '2026-05-24',
      currentTime: '06:00',
      todayLessons: [lesson()],
      overdueLessons: [],
      attendanceMarkedCount: 0,
      quranSessionCount: 0,
    })
    expect(result).toEqual({ tasksCompleted: 0, tasksInProgress: 0, tasksOverdue: 0 })
  })

  test('counts completed lessons, attendance, and quran sessions', () => {
    const result = computeTaskMetrics({
      today: '2026-05-24',
      currentTime: '18:00',
      todayLessons: [
        lesson({ id: 'l1', status: 'completed' }),
        lesson({ id: 'l2', status: 'completed', order: 2 }),
      ],
      overdueLessons: [],
      attendanceMarkedCount: 2,
      quranSessionCount: 1,
    })
    expect(result.tasksCompleted).toBe(5)
  })

  test('counts overdue lessons before today', () => {
    const result = computeTaskMetrics({
      today: '2026-05-24',
      currentTime: '10:00',
      todayLessons: [],
      overdueLessons: [
        lesson({ dueDate: '2026-05-20', status: 'not_started' }),
        lesson({ id: 'l2', dueDate: '2026-05-23', status: 'not_started' }),
        lesson({ id: 'l3', dueDate: '2026-05-24', status: 'not_started' }),
      ],
      attendanceMarkedCount: 0,
      quranSessionCount: 0,
    })
    expect(result.tasksOverdue).toBe(2)
  })

  test('marks in-progress when current schedule block is active', () => {
    const result = computeTaskMetrics({
      today: '2026-05-24',
      currentTime: '08:45',
      todayLessons: [
        lesson({ id: 'l1', order: 1, status: 'not_started' }),
        lesson({ id: 'l2', order: 2, status: 'not_started' }),
      ],
      overdueLessons: [],
      attendanceMarkedCount: 0,
      quranSessionCount: 0,
      scheduleStartTime: '08:30',
    })
    expect(result.tasksInProgress).toBe(1)
  })
})

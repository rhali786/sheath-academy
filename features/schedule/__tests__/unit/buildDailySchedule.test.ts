import { buildDailySchedule } from '@/features/schedule/server/service'
import { courseTimesFromSubjects } from '@/features/schedule/lib/courseTimes'
import type { LessonTask } from '@/features/plan/types'
import type { ScheduleSettings } from '@/features/schedule/types'
import type { RecurringScheduleBlock } from '@/features/subjects/types'

function lesson(id: string, subjectId: string, overrides: Partial<LessonTask> = {}): LessonTask {
  return {
    id, childId: 'child_001', subjectId, householdId: 'hh', title: id, dueDate: '2026-10-13',
    status: 'not_started', order: 0, estimatedDuration: '30min',
    createdAt: '2026-01-01T00:00:00Z', updatedAt: '2026-01-01T00:00:00Z',
    ...overrides,
  }
}

const WEEKDAYS: RecurringScheduleBlock['daysOfWeek'] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const MATH_BLOCK: RecurringScheduleBlock = { daysOfWeek: WEEKDAYS, startTime: '10:15', endTime: '11:00' }

const BASE: ScheduleSettings = { startTime: '08:30', transitionMinutes: 10, defaultDurationMinutes: 30 }
const TUESDAY = '2026-10-13'
const SATURDAY = '2026-10-17'

function block(schedule: ReturnType<typeof buildDailySchedule>, id: string) {
  return schedule.blocks.find(b => b.lesson.id === id)!
}

describe('buildDailySchedule — course recurring times', () => {
  it('places an untimed lesson at its course block for that weekday, locked', () => {
    const schedule = buildDailySchedule([lesson('math', 'math')], {
      ...BASE, date: TUESDAY, courseTimes: { math: [MATH_BLOCK] },
    })
    expect(block(schedule, 'math')).toMatchObject({
      startTime: '10:15', endTime: '11:00', durationMinutes: 45, flexibilityState: 'locked',
    })
    expect(schedule.date).toBe(TUESDAY)
  })

  it('an explicit lesson time wins over the course time', () => {
    const schedule = buildDailySchedule(
      [lesson('math', 'math', { scheduledStartTime: '13:00', scheduledEndTime: '13:30' })],
      { ...BASE, date: TUESDAY, courseTimes: { math: [MATH_BLOCK] } },
    )
    expect(block(schedule, 'math')).toMatchObject({ startTime: '13:00', endTime: '13:30' })
  })

  it('stacks from the start time when the course has no block for that weekday', () => {
    const schedule = buildDailySchedule([lesson('math', 'math')], {
      ...BASE, date: SATURDAY, courseTimes: { math: [MATH_BLOCK] },
    })
    expect(block(schedule, 'math')).toMatchObject({ startTime: '08:30', endTime: '09:00' })
    expect(block(schedule, 'math').flexibilityState).toBeUndefined()
  })

  it('picks the block that covers the weekday when a course has several', () => {
    const tueThu: RecurringScheduleBlock = { daysOfWeek: ['Tuesday', 'Thursday'], startTime: '14:00', endTime: '14:30' }
    const monWed: RecurringScheduleBlock = { daysOfWeek: ['Monday', 'Wednesday'], startTime: '09:00', endTime: '09:45' }
    const schedule = buildDailySchedule([lesson('art', 'art')], {
      ...BASE, date: TUESDAY, courseTimes: { art: [monWed, tueThu] },
    })
    expect(block(schedule, 'art')).toMatchObject({ startTime: '14:00', endTime: '14:30' })
  })

  it('untimed lessons without a course block keep stacking after course-timed ones', () => {
    const schedule = buildDailySchedule(
      [lesson('math', 'math'), lesson('read', 'reading')],
      { ...BASE, date: TUESDAY, courseTimes: { math: [{ ...MATH_BLOCK, startTime: '08:30', endTime: '09:15' }] } },
    )
    expect(block(schedule, 'math')).toMatchObject({ startTime: '08:30', endTime: '09:15' })
    expect(block(schedule, 'read')).toMatchObject({ startTime: '09:25', endTime: '09:55' })
  })

  it('two courses with overlapping times both render at their own times', () => {
    const schedule = buildDailySchedule([lesson('math', 'math'), lesson('sci', 'science')], {
      ...BASE, date: TUESDAY,
      courseTimes: { math: [MATH_BLOCK], science: [{ daysOfWeek: WEEKDAYS, startTime: '10:30', endTime: '11:15' }] },
    })
    expect(block(schedule, 'math').startTime).toBe('10:15')
    expect(block(schedule, 'sci').startTime).toBe('10:30')
  })

  it('without date or courseTimes the output is unchanged (regression)', () => {
    const lessons = [lesson('a', 'math'), lesson('b', 'reading', { estimatedDuration: '45min' })]
    const before = buildDailySchedule(lessons, BASE)
    const withEmpty = buildDailySchedule(lessons, { ...BASE, courseTimes: {} })
    const withoutDate = buildDailySchedule(lessons, { ...BASE, courseTimes: { math: [MATH_BLOCK] } })
    for (const s of [withEmpty, withoutDate]) {
      expect(s.blocks.map(b => [b.startTime, b.endTime])).toEqual(before.blocks.map(b => [b.startTime, b.endTime]))
    }
  })
})

describe('courseTimesFromSubjects', () => {
  it('maps course ids to their recurring blocks, skipping courses without any', () => {
    expect(courseTimesFromSubjects([
      { id: 'math', recurringSchedule: [MATH_BLOCK] },
      { id: 'art', recurringSchedule: [] },
      { id: 'read', recurringSchedule: null },
      { id: 'sci' },
    ])).toEqual({ math: [MATH_BLOCK] })
  })
})

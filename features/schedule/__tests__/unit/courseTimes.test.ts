import { courseTimeFor, describeLessonTime } from '@/features/schedule/lib/courseTimes'
import type { RecurringScheduleBlock } from '@/features/subjects/types'

// 2026-10-12 is a Monday; 2026-10-17 a Saturday.
const mathBlocks: RecurringScheduleBlock[] = [
  { daysOfWeek: ['Monday', 'Wednesday'], startTime: '10:15', endTime: '11:00' },
  { daysOfWeek: ['Friday'], startTime: '09:00', endTime: '09:45' },
]

describe('courseTimeFor', () => {
  it("returns the course's block for that date's weekday", () => {
    expect(courseTimeFor({ s1: mathBlocks }, 's1', '2026-10-12')).toEqual(mathBlocks[0])
    expect(courseTimeFor({ s1: mathBlocks }, 's1', '2026-10-16')).toEqual(mathBlocks[1])
  })

  it('returns null on a weekday with no block, for a course with no time, or without a date', () => {
    expect(courseTimeFor({ s1: mathBlocks }, 's1', '2026-10-17')).toBeNull()
    expect(courseTimeFor({ s1: mathBlocks }, 's2', '2026-10-12')).toBeNull()
    expect(courseTimeFor({ s1: mathBlocks }, 's1', '')).toBeNull()
    expect(courseTimeFor(undefined, 's1', '2026-10-12')).toBeNull()
  })

  it('reads the date as a local calendar day, not UTC', () => {
    // A UTC parse of "2026-10-12" can land on Sunday in US time zones.
    expect(courseTimeFor({ s1: [{ daysOfWeek: ['Monday'], startTime: '08:00', endTime: '08:30' }] }, 's1', '2026-10-12')).not.toBeNull()
  })
})

describe('describeLessonTime', () => {
  const base = { courseName: 'Math', blocks: mathBlocks }

  it("says it uses the course's time on that weekday", () => {
    expect(describeLessonTime({ ...base, date: '2026-10-12' })).toBe("Uses Math's time on Mondays: 10:15 AM.")
  })

  it('explains the 8:30 start when the course has no time that weekday (UAT 2.5 / 3.7)', () => {
    expect(describeLessonTime({ ...base, date: '2026-10-17' }))
      .toBe("Math has no set time on Saturdays, so this lesson takes its place in the day's order (from 8:30 AM).")
  })

  it('explains a course with no weekly time at all', () => {
    expect(describeLessonTime({ courseName: 'Science', blocks: undefined, date: '2026-10-12' }))
      .toBe("Science has no weekly time, so this lesson takes its place in the day's order (from 8:30 AM).")
  })

  it("says nothing when the lesson has its own time — that always wins", () => {
    expect(describeLessonTime({ ...base, date: '2026-10-17', ownStart: '13:00', ownEnd: '13:30' })).toBeNull()
  })

  it('says nothing without a course or a date', () => {
    expect(describeLessonTime({ courseName: '', blocks: mathBlocks, date: '2026-10-12' })).toBeNull()
    expect(describeLessonTime({ ...base, date: '' })).toBeNull()
  })

  it('formats afternoon and noon times', () => {
    expect(describeLessonTime({ courseName: 'Art', blocks: [{ daysOfWeek: ['Monday'], startTime: '13:05', endTime: '14:00' }], date: '2026-10-12' }))
      .toBe("Uses Art's time on Mondays: 1:05 PM.")
    expect(describeLessonTime({ courseName: 'Art', blocks: [{ daysOfWeek: ['Monday'], startTime: '12:00', endTime: '12:30' }], date: '2026-10-12' }))
      .toBe("Uses Art's time on Mondays: 12:00 PM.")
  })
})

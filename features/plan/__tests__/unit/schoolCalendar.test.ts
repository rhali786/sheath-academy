import { isSchoolDay, remapDates, type SchoolCalendar } from '@/features/plan/utils/schoolCalendar'
import type { DayOfWeek } from '@/features/lib/types'

const MON_FRI: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
const THANKSGIVING = { id: 'br_tg', name: 'Thanksgiving', startDate: '2026-11-25', endDate: '2026-11-27' }

const noBreaks: SchoolCalendar = { schoolDays: MON_FRI, breaks: [] }
const withThanksgiving: SchoolCalendar = { schoolDays: MON_FRI, breaks: [THANKSGIVING] }

function shift(dates: string[], calendar: SchoolCalendar, offset: number) {
  return remapDates(dates, { before: calendar, after: calendar, offset })
}

describe('isSchoolDay', () => {
  it('is false for days outside the school week', () => {
    expect(isSchoolDay('2026-11-21', noBreaks)).toBe(false) // Saturday
    expect(isSchoolDay('2026-11-22', noBreaks)).toBe(false) // Sunday
    expect(isSchoolDay('2026-11-20', noBreaks)).toBe(true) // Friday
  })

  it('is false for every date inside a break, inclusive of both ends', () => {
    expect(isSchoolDay('2026-11-24', withThanksgiving)).toBe(true)
    expect(isSchoolDay('2026-11-25', withThanksgiving)).toBe(false)
    expect(isSchoolDay('2026-11-26', withThanksgiving)).toBe(false)
    expect(isSchoolDay('2026-11-27', withThanksgiving)).toBe(false)
  })

  it('honours a six-day school week', () => {
    expect(isSchoolDay('2026-11-21', { schoolDays: [...MON_FRI, 'Saturday'], breaks: [] })).toBe(true)
  })
})

describe('remapDates — shift by N school days', () => {
  it('moves each date forward by N school days, skipping weekends and breaks', () => {
    const result = shift(['2026-11-20', '2026-11-24'], withThanksgiving, 1)
    expect(result.get('2026-11-20')).toBe('2026-11-23') // Fri -> Mon
    expect(result.get('2026-11-24')).toBe('2026-11-30') // Tue -> (break Wed-Fri, weekend) -> Mon
  })

  it('a one-week shift on a Mon-Fri calendar lands on the same weekday next week', () => {
    const result = shift(['2026-10-13', '2026-10-16'], noBreaks, 5)
    expect(result.get('2026-10-13')).toBe('2026-10-20')
    expect(result.get('2026-10-16')).toBe('2026-10-23')
  })

  it('keeps lessons that shared a day together on the same new day', () => {
    const result = shift(['2026-11-24', '2026-11-24'], withThanksgiving, 2)
    expect(result.get('2026-11-24')).toBe('2026-12-01')
    expect(result.size).toBe(1)
  })

  it('snaps a date on a non-school day to the next school day before shifting', () => {
    const result = shift(['2026-11-21'], noBreaks, 1) // Saturday
    expect(result.get('2026-11-21')).toBe('2026-11-24') // snaps to Mon (ordinal), +1 -> Tue
  })

  it('offset 0 on an unchanged calendar leaves school-day dates alone', () => {
    const result = shift(['2026-11-23'], noBreaks, 0)
    expect(result.get('2026-11-23')).toBe('2026-11-23')
  })

  it('crosses month ends and the November DST change without drifting', () => {
    const result = shift(['2026-10-30', '2026-11-02'], noBreaks, 1)
    expect(result.get('2026-10-30')).toBe('2026-11-02') // Fri Oct 30 -> Mon Nov 2 (DST ends Nov 1)
    expect(result.get('2026-11-02')).toBe('2026-11-03')
  })

  it('runs past any school-year end rather than throwing', () => {
    const result = shift(['2027-06-04'], noBreaks, 10)
    expect(result.get('2027-06-04')).toBe('2027-06-18')
  })
})

describe('remapDates — adding a break', () => {
  it('pushes lessons in and after the new break by the school days it removed', () => {
    const result = remapDates(['2026-11-24', '2026-11-25', '2026-11-27', '2026-11-30', '2026-12-01'], {
      before: noBreaks,
      after: withThanksgiving,
      offset: 0,
    })
    expect(result.get('2026-11-24')).toBe('2026-11-24') // before the break: untouched
    expect(result.get('2026-11-25')).toBe('2026-11-30')
    expect(result.get('2026-11-27')).toBe('2026-12-02')
    expect(result.get('2026-11-30')).toBe('2026-12-03')
    expect(result.get('2026-12-01')).toBe('2026-12-04')
  })
})

describe('remapDates — guards', () => {
  it('throws when the calendar has no school days', () => {
    expect(() => shift(['2026-11-23'], { schoolDays: [], breaks: [] }, 1)).toThrow(/school day/i)
  })

  it('returns an empty map for no dates', () => {
    expect(shift([], noBreaks, 3).size).toBe(0)
  })
})

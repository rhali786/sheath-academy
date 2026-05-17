import { getWeekStartDate } from '@/features/plan/front/utils/weekDate'

// May 2026 calendar reference:
// May 4  = Monday (dayOfWeek 1)
// May 10 = Sunday (dayOfWeek 0)
// May 11 = Monday (dayOfWeek 1)
// May 14 = Thursday (dayOfWeek 4)
// May 15 = Friday (dayOfWeek 5)
// May 17 = Sunday (dayOfWeek 0)
// May 18 = Monday (dayOfWeek 1)

describe('getWeekStartDate', () => {
  it('returns the same Monday when input is already a Monday (Monday start)', () => {
    // May 11 is Monday → week starts on May 11
    expect(getWeekStartDate(new Date('2026-05-11T12:00:00'), 'Monday')).toBe('2026-05-11')
  })

  it('returns the previous Monday for a Friday input (Monday start)', () => {
    // May 15 is Friday → week started on Monday May 11
    expect(getWeekStartDate(new Date('2026-05-15T12:00:00'), 'Monday')).toBe('2026-05-11')
  })

  it('returns 6 days back for a Sunday input with Monday start', () => {
    // May 17 is Sunday → week started on Monday May 11
    expect(getWeekStartDate(new Date('2026-05-17T12:00:00'), 'Monday')).toBe('2026-05-11')
  })

  it('returns the same Sunday when input is already a Sunday (Sunday start)', () => {
    // May 17 is Sunday → week starts on May 17
    expect(getWeekStartDate(new Date('2026-05-17T12:00:00'), 'Sunday')).toBe('2026-05-17')
  })

  it('returns the previous Sunday for a Friday input with Sunday start', () => {
    // May 15 is Friday → previous Sunday is May 10
    expect(getWeekStartDate(new Date('2026-05-15T12:00:00'), 'Sunday')).toBe('2026-05-10')
  })

  it('returns the previous Sunday for a Monday input with Sunday start', () => {
    // May 11 is Monday → previous Sunday is May 10
    expect(getWeekStartDate(new Date('2026-05-11T12:00:00'), 'Sunday')).toBe('2026-05-10')
  })
})

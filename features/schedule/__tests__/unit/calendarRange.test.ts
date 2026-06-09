import { getCalendarRange } from '../../front/lib/calendarRange'

describe('getCalendarRange — day mode', () => {
  it('returns [date, date] for day mode', () => {
    const { startDate, endDate } = getCalendarRange('2026-03-15', 'day', 'Monday')
    expect(startDate).toBe('2026-03-15')
    expect(endDate).toBe('2026-03-15')
  })
})

describe('getCalendarRange — week mode (weekStartDay = Monday)', () => {
  it('week containing a Wednesday spans Mon–Sun', () => {
    // 2026-03-18 is a Wednesday
    const { startDate, endDate } = getCalendarRange('2026-03-18', 'week', 'Monday')
    expect(startDate).toBe('2026-03-16') // Monday
    expect(endDate).toBe('2026-03-22')   // Sunday
  })

  it('week containing a Monday starts on that Monday', () => {
    // 2026-03-16 is a Monday
    const { startDate, endDate } = getCalendarRange('2026-03-16', 'week', 'Monday')
    expect(startDate).toBe('2026-03-16')
    expect(endDate).toBe('2026-03-22')
  })

  it('week containing a Sunday ends on that Sunday (Monday start)', () => {
    // 2026-03-22 is a Sunday
    const { startDate, endDate } = getCalendarRange('2026-03-22', 'week', 'Monday')
    expect(startDate).toBe('2026-03-16')
    expect(endDate).toBe('2026-03-22')
  })
})

describe('getCalendarRange — week mode (weekStartDay = Sunday)', () => {
  it('week containing a Wednesday spans Sun–Sat', () => {
    // 2026-03-18 is a Wednesday; Sun start → week is Mar 15–21
    const { startDate, endDate } = getCalendarRange('2026-03-18', 'week', 'Sunday')
    expect(startDate).toBe('2026-03-15') // Sunday
    expect(endDate).toBe('2026-03-21')   // Saturday
  })

  it('week containing a Sunday starts on that Sunday', () => {
    // 2026-03-15 is a Sunday
    const { startDate, endDate } = getCalendarRange('2026-03-15', 'week', 'Sunday')
    expect(startDate).toBe('2026-03-15')
    expect(endDate).toBe('2026-03-21')
  })
})

describe('getCalendarRange — month mode', () => {
  it('March 2026 grid spans Mon Feb 23 – Sun Apr 5 (Monday start)', () => {
    // March 2026: starts on Sunday; grid week starts Monday
    // First Monday on/before Mar 1 (Sunday) = Feb 23
    // Last Sunday on/after Mar 31 (Tuesday) = Apr 5
    const { startDate, endDate, days } = getCalendarRange('2026-03-15', 'month', 'Monday')
    expect(startDate).toBe('2026-02-23')
    expect(endDate).toBe('2026-04-05')
    expect(days.length).toBe(42) // 6 complete weeks
  })

  it('all days in grid have valid YYYY-MM-DD strings', () => {
    const { days } = getCalendarRange('2026-03-15', 'month', 'Monday')
    for (const d of days) {
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    }
    // First day is Feb 23, last is Apr 5
    expect(days[0]).toBe('2026-02-23')
    expect(days[days.length - 1]).toBe('2026-04-05')
  })

  it('Jan 2026 grid spans Mon Dec 29 – Sun Feb 1 (Monday start)', () => {
    // Jan 1 2026 is a Thursday; Mon start
    const { startDate, endDate } = getCalendarRange('2026-01-15', 'month', 'Monday')
    expect(startDate).toBe('2025-12-29')
    expect(endDate).toBe('2026-02-01')
  })

  it('lead/trail days are outside the focused month', () => {
    const { days, focusedMonth } = getCalendarRange('2026-03-15', 'month', 'Monday')
    const leadDays = days.filter(d => d < `${focusedMonth}-01`)
    const trailDays = days.filter(d => {
      const [y, m] = focusedMonth.split('-').map(Number)
      const lastDay = new Date(y, m, 0).getDate()
      return d > `${focusedMonth}-${String(lastDay).padStart(2, '0')}`
    })
    expect(leadDays.length).toBeGreaterThan(0)
    expect(trailDays.length).toBeGreaterThan(0)
  })
})

describe('getCalendarRange — navigation helpers', () => {
  it('navigatePrev day goes back 1 day', () => {
    const { navigatePrev } = getCalendarRange('2026-03-15', 'day', 'Monday')
    expect(navigatePrev).toBe('2026-03-14')
  })

  it('navigateNext day goes forward 1 day', () => {
    const { navigateNext } = getCalendarRange('2026-03-15', 'day', 'Monday')
    expect(navigateNext).toBe('2026-03-16')
  })

  it('navigatePrev week goes back 7 days', () => {
    const { navigatePrev } = getCalendarRange('2026-03-18', 'week', 'Monday')
    expect(navigatePrev).toBe('2026-03-11')
  })

  it('navigateNext week goes forward 7 days', () => {
    const { navigateNext } = getCalendarRange('2026-03-18', 'week', 'Monday')
    expect(navigateNext).toBe('2026-03-25')
  })

  it('navigatePrev month goes back 1 month', () => {
    const { navigatePrev } = getCalendarRange('2026-03-15', 'month', 'Monday')
    expect(navigatePrev).toBe('2026-02-15')
  })

  it('navigateNext month goes forward 1 month', () => {
    const { navigateNext } = getCalendarRange('2026-03-15', 'month', 'Monday')
    expect(navigateNext).toBe('2026-04-15')
  })
})

import { formatHeaderDates } from '@/features/layout/lib/formatHeaderDates'

describe('formatHeaderDates', () => {
  test('UTC noon 12 May 2026 yields AH suffix, Gregorian year, and Arabic Hijri line', () => {
    const d = new Date(Date.UTC(2026, 4, 12, 12, 0, 0))
    const r = formatHeaderDates(d, { timeZone: 'UTC' })
    expect(r.hijriYearAndGregorian).toMatch(/^\d+ AH · [A-Za-z]{3}, \d{1,2} May 2026$/)
    expect(r.hijriDayMonthAr.length).toBeGreaterThan(3)
  })
})

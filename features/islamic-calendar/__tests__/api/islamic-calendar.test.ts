import {
  gregorianToHijri,
  hijriToGregorian,
  isInSacredMonth,
  getWhiteDays,
  getIslamicCalendarCountdowns,
} from '../../front/lib/countdowns'

describe('gregorianToHijri', () => {
  it('converts 2026-01-01 to Rajab 1447 AH (month 7)', () => {
    const result = gregorianToHijri(2026, 1, 1)
    expect(result.year).toBe(1447)
    expect(result.month).toBe(7) // Rajab — a sacred month
  })

  it('converts 2026-01-20 to Sha\'ban 1447 AH (month 8)', () => {
    const result = gregorianToHijri(2026, 1, 20)
    expect(result.year).toBe(1447)
    expect(result.month).toBe(8) // Sha'ban — not sacred
  })
})

describe('hijriToGregorian', () => {
  it('converts 1 Rajab 1447 to 2025-12-21', () => {
    expect(hijriToGregorian(1447, 7, 1)).toBe('2025-12-21')
  })

  it('converts 1 Ramadan 1447 to 2026-02-18', () => {
    expect(hijriToGregorian(1447, 9, 1)).toBe('2026-02-18')
  })

  it('converts 1 Shawwal 1447 (Eid al-Fitr) to 2026-03-20', () => {
    expect(hijriToGregorian(1447, 10, 1)).toBe('2026-03-20')
  })
})

describe('isInSacredMonth', () => {
  it('returns true when date is in Rajab 1447 (sacred month)', () => {
    // 2026-01-01 = 14 Rajab 1447 — Rajab is month 7, a sacred month
    expect(isInSacredMonth('2026-01-01')).toBe(true)
  })

  it('returns false when date is in Sha\'ban 1447 (non-sacred)', () => {
    // 2026-01-20 = 1 Sha'ban 1447 — Sha'ban is month 8, not sacred
    expect(isInSacredMonth('2026-01-20')).toBe(false)
  })
})

describe('getWhiteDays', () => {
  it('returns 13th, 14th, 15th of Ramadan 1447 in Gregorian', () => {
    const result = getWhiteDays(1447, 9)
    expect(result.day13).toBe('2026-03-02')
    expect(result.day14).toBe('2026-03-03')
    expect(result.day15).toBe('2026-03-04')
  })

  it('returns 13th, 14th, 15th of Rajab 1447 in Gregorian', () => {
    const result = getWhiteDays(1447, 7)
    expect(result.day13).toBe('2026-01-02')
    expect(result.day14).toBe('2026-01-03')
    expect(result.day15).toBe('2026-01-04')
  })
})

describe('getIslamicCalendarCountdowns', () => {
  it('returns an array where all daysUntil are >= 0 for 2026-01-01', () => {
    const result = getIslamicCalendarCountdowns('2026-01-01')
    expect(result.length).toBeGreaterThan(0)
    for (const countdown of result) {
      expect(countdown.daysUntil).toBeGreaterThanOrEqual(0)
    }
  })

  it('includes Ramadan with correct date and daysUntil from 2026-01-01', () => {
    const result = getIslamicCalendarCountdowns('2026-01-01')
    const ramadan = result.find(c => c.name === 'Ramadan')
    expect(ramadan).toBeDefined()
    expect(ramadan!.date).toBe('2026-02-18')
    expect(ramadan!.daysUntil).toBe(48)
  })

  it('includes Sacred Month with daysUntil=0 when currently in Rajab', () => {
    // 2026-01-01 is in Rajab 1447 (sacred month)
    const result = getIslamicCalendarCountdowns('2026-01-01')
    const sacred = result.find(c => c.name === 'Sacred Month')
    expect(sacred).toBeDefined()
    expect(sacred!.daysUntil).toBe(0)
  })

  it('includes White Days with daysUntil=1 when next white days start tomorrow', () => {
    // From 2026-01-01, Rajab white days start 2026-01-02 (1 day away)
    const result = getIslamicCalendarCountdowns('2026-01-01')
    const whiteDays = result.find(c => c.name === 'White Days')
    expect(whiteDays).toBeDefined()
    expect(whiteDays!.daysUntil).toBe(1)
  })
})

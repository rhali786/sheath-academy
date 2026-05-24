import { toDateString, getHouseholdLocalDate } from '../server/date'

describe('toDateString', () => {
  it('returns YYYY-MM-DD for a UTC timestamp in UTC', () => {
    const date = new Date('2025-01-15T00:00:00Z')
    expect(toDateString(date, 'UTC')).toBe('2025-01-15')
  })

  it('returns the previous calendar day in a behind-UTC timezone', () => {
    // 2025-01-15T01:00:00Z is still 2025-01-14 in America/New_York (UTC-5)
    const date = new Date('2025-01-15T01:00:00Z')
    expect(toDateString(date, 'America/New_York')).toBe('2025-01-14')
  })

  it('returns the next calendar day in an ahead-UTC timezone', () => {
    // 2025-01-14T23:00:00Z is 2025-01-15 in Asia/Riyadh (UTC+3)
    const date = new Date('2025-01-14T23:00:00Z')
    expect(toDateString(date, 'Asia/Riyadh')).toBe('2025-01-15')
  })

  it('uses UTC when timezone is UTC', () => {
    const date = new Date('2025-06-01T12:00:00Z')
    expect(toDateString(date, 'UTC')).toBe('2025-06-01')
  })
})

describe('getHouseholdLocalDate', () => {
  it('returns a YYYY-MM-DD string for a known timezone', () => {
    const result = getHouseholdLocalDate('America/New_York')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a YYYY-MM-DD string for UTC', () => {
    const result = getHouseholdLocalDate('UTC')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })

  it('returns a YYYY-MM-DD string for a Middle-East timezone', () => {
    const result = getHouseholdLocalDate('Asia/Riyadh')
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

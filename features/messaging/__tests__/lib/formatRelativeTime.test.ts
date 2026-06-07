import { formatDaySeparator, formatRelativeTime } from '@/features/messaging/front/lib/formatRelativeTime'

describe('formatRelativeTime', () => {
  const now = new Date('2026-06-07T12:00:00Z')

  it('returns Just now for timestamps under one minute old', () => {
    expect(formatRelativeTime('2026-06-07T11:59:30Z', now)).toBe('Just now')
  })

  it('returns minute shorthand for recent messages', () => {
    expect(formatRelativeTime('2026-06-07T11:45:00Z', now)).toBe('15m')
  })

  it('returns Yesterday for the previous calendar day', () => {
    expect(formatRelativeTime('2026-06-06T18:00:00Z', now)).toBe('Yesterday')
  })
})

describe('formatDaySeparator', () => {
  const now = new Date('2026-06-07T12:00:00Z')

  it('labels the current day as Today', () => {
    expect(formatDaySeparator('2026-06-07T08:00:00Z', now)).toBe('Today')
  })

  it('labels the previous day as Yesterday', () => {
    expect(formatDaySeparator('2026-06-06T08:00:00Z', now)).toBe('Yesterday')
  })

  it('labels older days with a full weekday and date', () => {
    expect(formatDaySeparator('2026-06-01T08:00:00Z', now)).toMatch(/June 1/)
  })
})

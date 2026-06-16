import { formatMinutes } from '@/features/records/front/lib/formatDuration'

describe('formatMinutes', () => {
  it('formats 0 minutes as "0m"', () => {
    expect(formatMinutes(0)).toBe('0m')
  })

  it('formats sub-hour durations as "Xm"', () => {
    expect(formatMinutes(15)).toBe('15m')
  })

  it('formats exact hours as "Xh Ym"', () => {
    expect(formatMinutes(60)).toBe('1h 0m')
  })

  it('formats hours and minutes as "Xh Ym"', () => {
    expect(formatMinutes(135)).toBe('2h 15m')
  })
})

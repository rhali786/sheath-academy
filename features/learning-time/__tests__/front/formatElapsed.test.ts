import { formatElapsed } from '@/features/learning-time/front/lib/formatElapsed'

describe('formatElapsed', () => {
  it('formats sub-hour durations as MM:SS', () => {
    expect(formatElapsed(0)).toBe('00:00')
    expect(formatElapsed(42)).toBe('00:42')
    expect(formatElapsed(125)).toBe('02:05')
    expect(formatElapsed(3599)).toBe('59:59')
  })

  it('formats durations of an hour or more as H:MM:SS', () => {
    expect(formatElapsed(3600)).toBe('1:00:00')
    expect(formatElapsed(8120)).toBe('2:15:20')
  })

  it('clamps negative or fractional input to a non-negative whole second count', () => {
    expect(formatElapsed(-5)).toBe('00:00')
    expect(formatElapsed(61.9)).toBe('01:01')
  })
})

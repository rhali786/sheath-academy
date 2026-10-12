import { lessonRangeStart, LESSON_LIST_RANGES } from '@/features/plan/utils/lessonListRange'

describe('lessonRangeStart', () => {
  it('"week" starts on the Monday of the current week', () => {
    expect(lessonRangeStart('week', '2026-10-14')).toBe('2026-10-12') // Wednesday → Monday
    expect(lessonRangeStart('week', '2026-10-12')).toBe('2026-10-12') // Monday → itself
    expect(lessonRangeStart('week', '2026-10-18')).toBe('2026-10-12') // Sunday → previous Monday
  })

  it('"month" starts 30 days before today, across a month boundary', () => {
    expect(lessonRangeStart('month', '2026-10-12')).toBe('2026-09-12')
    expect(lessonRangeStart('month', '2026-03-01')).toBe('2026-01-30')
  })

  it('"all" has no start date', () => {
    expect(lessonRangeStart('all', '2026-10-12')).toBeUndefined()
  })

  it('every range includes today, so the Today section always has its lessons', () => {
    for (const { value } of LESSON_LIST_RANGES) {
      const start = lessonRangeStart(value, '2026-10-14')
      expect(start === undefined || start <= '2026-10-14').toBe(true)
    }
  })
})

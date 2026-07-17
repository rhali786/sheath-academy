import { isOffDay, DEFAULT_SCHOOL_DAYS } from '@/features/plan/utils/schoolDays'
import type { DayOfWeek } from '@/features/lib/types'

describe('isOffDay', () => {
  it('defaults to Mon–Fri school days when schoolDays is undefined', () => {
    // Sunday=0, Saturday=6 are off; Monday=1..Friday=5 are school days
    expect(isOffDay(0)).toBe(true)
    expect(isOffDay(1)).toBe(false)
    expect(isOffDay(2)).toBe(false)
    expect(isOffDay(3)).toBe(false)
    expect(isOffDay(4)).toBe(false)
    expect(isOffDay(5)).toBe(false)
    expect(isOffDay(6)).toBe(true)
  })

  it('DEFAULT_SCHOOL_DAYS is Mon–Fri', () => {
    expect(DEFAULT_SCHOOL_DAYS).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])
  })

  it('returns correct boolean for a custom schoolDays set (off on Wednesday, not weekends)', () => {
    const customDays: DayOfWeek[] = ['Monday', 'Tuesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    // Wednesday (index 3) is off
    expect(isOffDay(3, customDays)).toBe(true)
    // Saturday (index 6) and Sunday (index 0) are school days for this household
    expect(isOffDay(6, customDays)).toBe(false)
    expect(isOffDay(0, customDays)).toBe(false)
    // Monday remains a school day
    expect(isOffDay(1, customDays)).toBe(false)
  })

  it('Saturday is NOT off when schoolDays includes Saturday (proves not hardcoded)', () => {
    const coOpSaturday: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    expect(isOffDay(6, coOpSaturday)).toBe(false)
    // Sunday remains off since it's not in the set
    expect(isOffDay(0, coOpSaturday)).toBe(true)
  })
})

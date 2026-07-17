import type { DayOfWeek } from '@/features/lib/types'

/**
 * Default school days when a household has never customized `schoolDays`.
 * Mirrors HouseholdSettings.tsx's own default (Mon–Fri) so the two never drift apart.
 */
export const DEFAULT_SCHOOL_DAYS: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

const DAY_OF_WEEK_BY_INDEX: DayOfWeek[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

/**
 * True when `dayIndex` (JS Date.getDay(): 0=Sunday..6=Saturday) is an "off day" for the
 * household — i.e. not one of its school days. Falls back to the Mon–Fri default when
 * `schoolDays` is undefined (household has not customized the setting).
 */
export function isOffDay(dayIndex: number, schoolDays?: DayOfWeek[]): boolean {
  const activeDays = schoolDays ?? DEFAULT_SCHOOL_DAYS
  const dayName = DAY_OF_WEEK_BY_INDEX[dayIndex]
  return !activeDays.includes(dayName)
}

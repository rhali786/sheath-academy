import type { DayOfWeek } from '@/features/lib/types'
import type { SchoolBreak } from '@/features/school-year/types'

/**
 * The calendar lessons are placed on: the household's school days (Settings → Household)
 * minus every date inside one of the active school year's breaks.
 */
export interface SchoolCalendar {
  schoolDays: DayOfWeek[]
  breaks: SchoolBreak[]
}

const DAY_OF_WEEK_BY_INDEX: DayOfWeek[] = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
]

/** Hard stop so a calendar that is all break can never loop forever (~30 years of days). */
const MAX_DAYS_SCANNED = 11_000

// Dates are 'YYYY-MM-DD' strings handled as local calendar dates — never UTC — so DST and
// timezone offsets cannot move a lesson to the neighbouring day.
function parseLocal(date: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function formatLocal(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function nextDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1)
}

export function isSchoolDay(date: string, calendar: SchoolCalendar): boolean {
  const day = DAY_OF_WEEK_BY_INDEX[parseLocal(date).getDay()]
  if (!calendar.schoolDays.includes(day)) return false
  return !calendar.breaks.some(b => date >= b.startDate && date <= b.endDate)
}

/**
 * Moves dates along the school-day sequence.
 *
 * Each date's position is its ordinal among `before`'s school days counted from the earliest
 * date given (a non-school day takes the ordinal of the next school day). It lands on the
 * school day at `ordinal + offset` in `after`'s sequence. So:
 * - shifting by N: same calendar both sides, `offset = N`;
 * - adding a break: `after` includes the break, `before` does not, `offset = 0` — everything
 *   from the break onward slides back by exactly the school days the break removed.
 * Lessons sharing a day keep sharing it, and their order is preserved.
 *
 * Returns a map from each distinct input date to its new date.
 */
export function remapDates(
  dates: string[],
  options: { before: SchoolCalendar; after: SchoolCalendar; offset: number },
): Map<string, string> {
  const { before, after, offset } = options
  if (before.schoolDays.length === 0 || after.schoolDays.length === 0) {
    throw new Error('The calendar needs at least one school day')
  }

  const distinct = [...new Set(dates)].sort()
  const result = new Map<string, string>()
  if (distinct.length === 0) return result

  const anchor = parseLocal(distinct[0])

  // Ordinal of each date in the "before" sequence: school days in [anchor, date).
  const ordinals = new Map<string, number>()
  let count = 0
  let cursor = anchor
  let i = 0
  for (let scanned = 0; i < distinct.length; scanned++) {
    if (scanned > MAX_DAYS_SCANNED) throw new Error('No school days found in range')
    const current = formatLocal(cursor)
    while (i < distinct.length && distinct[i] === current) {
      ordinals.set(distinct[i], count)
      i++
    }
    if (isSchoolDay(current, before)) count++
    cursor = nextDay(cursor)
  }

  // Walk the "after" sequence once, collecting school days up to the furthest target.
  const targets = new Map<string, number>()
  for (const [date, ordinal] of ordinals) targets.set(date, Math.max(0, ordinal + offset))
  const maxTarget = Math.max(...targets.values())
  const sequence: string[] = []
  cursor = anchor
  for (let scanned = 0; sequence.length <= maxTarget; scanned++) {
    if (scanned > MAX_DAYS_SCANNED) throw new Error('No school days found in range')
    const current = formatLocal(cursor)
    if (isSchoolDay(current, after)) sequence.push(current)
    cursor = nextDay(cursor)
  }

  for (const [date, target] of targets) result.set(date, sequence[target])
  return result
}

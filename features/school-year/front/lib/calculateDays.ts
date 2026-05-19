import type { DayOfWeek, SchoolBreak } from '@/features/school-year/types'

const DAY_NAMES: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']

function parseLocalDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Pure client-side calculation: count planned school days between dates (inclusive),
 * excluding weekends not in schoolDays and any break dates.
 */
export function calculatePlannedDaysLocal(params: {
  startDate: string
  endDate: string
  schoolDays: DayOfWeek[]
  breaks?: SchoolBreak[]
}): number {
  const { startDate, endDate, schoolDays, breaks = [] } = params

  if (schoolDays.length === 0) return 0

  const breakDates = new Set<string>()
  for (const b of breaks) {
    const cur = parseLocalDate(b.startDate)
    const end = parseLocalDate(b.endDate)
    while (cur <= end) {
      const y = cur.getFullYear()
      const m = String(cur.getMonth() + 1).padStart(2, '0')
      const d = String(cur.getDate()).padStart(2, '0')
      breakDates.add(`${y}-${m}-${d}`)
      cur.setDate(cur.getDate() + 1)
    }
  }

  let count = 0
  const cur = parseLocalDate(startDate)
  const end = parseLocalDate(endDate)
  while (cur <= end) {
    const dayName = DAY_NAMES[cur.getDay()]
    const y = cur.getFullYear()
    const m = String(cur.getMonth() + 1).padStart(2, '0')
    const d = String(cur.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    if (schoolDays.includes(dayName) && !breakDates.has(dateStr)) {
      count++
    }
    cur.setDate(cur.getDate() + 1)
  }
  return count
}

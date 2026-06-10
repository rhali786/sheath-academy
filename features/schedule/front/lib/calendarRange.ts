export type ViewMode = 'day' | 'week' | 'month'

export interface CalendarRange {
  startDate: string
  endDate: string
  /** All days in the grid (for month mode: full weeks including lead/trail; for day/week: the visible days) */
  days: string[]
  /** YYYY-MM for the focused calendar month (month mode only; equals selectedDate's month otherwise) */
  focusedMonth: string
  /** Target date for the Previous navigation button */
  navigatePrev: string
  /** Target date for the Next navigation button */
  navigateNext: string
}

function dateToStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function parseDate(s: string): Date {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function addDays(s: string, n: number): string {
  const d = parseDate(s)
  d.setDate(d.getDate() + n)
  return dateToStr(d)
}

function addMonths(s: string, n: number): string {
  const [y, m, day] = s.split('-').map(Number)
  const d = new Date(y, m - 1 + n, day)
  // Clamp to last day of target month if overflow
  if (d.getMonth() !== (m - 1 + n + 12) % 12) {
    d.setDate(0)
  }
  return dateToStr(d)
}

function getWeekStart(date: string, weekStartDay: 'Monday' | 'Sunday'): string {
  const d = parseDate(date)
  const dow = d.getDay() // 0=Sun, 1=Mon, ..., 6=Sat
  const daysFromStart = weekStartDay === 'Monday'
    ? (dow === 0 ? 6 : dow - 1)
    : dow
  d.setDate(d.getDate() - daysFromStart)
  return dateToStr(d)
}

function enumerateDays(start: string, end: string): string[] {
  const days: string[] = []
  let cur = start
  while (cur <= end) {
    days.push(cur)
    cur = addDays(cur, 1)
  }
  return days
}

export function getCalendarRange(
  selectedDate: string,
  viewMode: ViewMode,
  weekStartDay: 'Monday' | 'Sunday',
): CalendarRange {
  const [y, m] = selectedDate.split('-').map(Number)
  const focusedMonth = `${y}-${String(m).padStart(2, '0')}`

  if (viewMode === 'day') {
    return {
      startDate: selectedDate,
      endDate: selectedDate,
      days: [selectedDate],
      focusedMonth,
      navigatePrev: addDays(selectedDate, -1),
      navigateNext: addDays(selectedDate, 1),
    }
  }

  if (viewMode === 'week') {
    const weekStart = getWeekStart(selectedDate, weekStartDay)
    const weekEnd = addDays(weekStart, 6)
    return {
      startDate: weekStart,
      endDate: weekEnd,
      days: enumerateDays(weekStart, weekEnd),
      focusedMonth,
      navigatePrev: addDays(selectedDate, -7),
      navigateNext: addDays(selectedDate, 7),
    }
  }

  // month mode: build a grid of complete weeks covering the entire calendar month
  const firstOfMonth = `${y}-${String(m).padStart(2, '0')}-01`
  const lastDay = new Date(y, m, 0).getDate()
  const lastOfMonth = `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Grid start: the week-start day on/before the 1st of the month
  const gridStart = getWeekStart(firstOfMonth, weekStartDay)
  // Grid end: 6 days after the week-start of the last day of the month
  const lastWeekStart = getWeekStart(lastOfMonth, weekStartDay)
  const gridEnd = addDays(lastWeekStart, 6)

  const days = enumerateDays(gridStart, gridEnd)

  return {
    startDate: gridStart,
    endDate: gridEnd,
    days,
    focusedMonth,
    navigatePrev: addMonths(selectedDate, -1),
    navigateNext: addMonths(selectedDate, 1),
  }
}

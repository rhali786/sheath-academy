/** Date range for the Lessons page list. Every range includes today. */
export type LessonListRange = 'week' | 'month' | 'all'

export const LESSON_LIST_RANGES: { value: LessonListRange; label: string }[] = [
  { value: 'week', label: 'This week & upcoming' },
  { value: 'month', label: 'Past 30 days & upcoming' },
  { value: 'all', label: 'All dates' },
]

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** First due date (YYYY-MM-DD) to load for `range`, or undefined for no lower bound. */
export function lessonRangeStart(range: LessonListRange, today: string): string | undefined {
  if (range === 'all') return undefined
  const d = new Date(`${today}T00:00:00`)
  if (range === 'week') d.setDate(d.getDate() - (d.getDay() === 0 ? 6 : d.getDay() - 1))
  else d.setDate(d.getDate() - 30)
  return formatLocalDate(d)
}

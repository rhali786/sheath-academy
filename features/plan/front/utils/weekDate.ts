export function getWeekStartDate(date: Date, weekStartDay: 'Monday' | 'Sunday'): string {
  const d = new Date(date)
  const dayOfWeek = d.getDay()
  const daysFromStart = weekStartDay === 'Monday'
    ? (dayOfWeek === 0 ? 6 : dayOfWeek - 1)
    : dayOfWeek
  d.setDate(d.getDate() - daysFromStart)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

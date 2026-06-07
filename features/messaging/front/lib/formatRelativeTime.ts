const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

function startOfUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
}

export function formatRelativeTime(iso: string, now = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const diffMs = now.getTime() - date.getTime()
  if (diffMs < MINUTE_MS) return 'Just now'
  if (diffMs < HOUR_MS) return `${Math.floor(diffMs / MINUTE_MS)}m`

  const today = startOfUtcDay(now)
  const messageDay = startOfUtcDay(date)
  const dayDiff = Math.floor((today.getTime() - messageDay.getTime()) / DAY_MS)

  if (dayDiff === 0) return `${Math.floor(diffMs / HOUR_MS)}h`
  if (dayDiff === 1) return 'Yesterday'

  const sameYear = date.getUTCFullYear() === now.getUTCFullYear()
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  })
}

/** Section heading shown between message groups: "Today", "Yesterday", or a full date. */
export function formatDaySeparator(iso: string, now = new Date()): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''

  const today = startOfUtcDay(now)
  const messageDay = startOfUtcDay(date)
  const dayDiff = Math.floor((today.getTime() - messageDay.getTime()) / DAY_MS)

  if (dayDiff === 0) return 'Today'
  if (dayDiff === 1) return 'Yesterday'

  const sameYear = date.getUTCFullYear() === now.getUTCFullYear()
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    ...(sameYear ? {} : { year: 'numeric' }),
    timeZone: 'UTC',
  })
}

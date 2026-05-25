import type { ScheduleEntry } from '../types'

export function getScheduleFooterCounts(entries: ScheduleEntry[]): {
  scheduledCount: number
  plannedCount: number
} {
  const plannedCount = entries.length
  const scheduledCount = entries.filter(
    entry =>
      entry.kind === 'lesson' &&
      (entry.lesson.status === 'completed' || entry.lesson.status === 'not_started'),
  ).length

  return { scheduledCount, plannedCount }
}

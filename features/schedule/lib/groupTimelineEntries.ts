import type { LessonScheduleEntry, ScheduleEntry } from '@/features/schedule/types'

export interface TimelineItem {
  /** The row's entry; for a shared lesson, its first copy. */
  entry: ScheduleEntry
  /** Lesson copies on this row (one per learner); empty for breaks. */
  copies: LessonScheduleEntry[]
}

/**
 * With every learner in view, a shared lesson is one entry per learner (same group_id). Copies
 * at the same time collapse into one row, placed where the first copy was; copies a learner
 * moved to another time stay their own rows. Order is preserved.
 */
export function groupTimelineEntries(entries: ScheduleEntry[]): TimelineItem[] {
  const items: TimelineItem[] = []
  const byKey = new Map<string, TimelineItem>()
  for (const entry of entries) {
    if (entry.kind !== 'lesson') {
      items.push({ entry, copies: [] })
      continue
    }
    const key = entry.lesson.groupId ? `${entry.lesson.groupId}|${entry.startTime}|${entry.endTime}` : null
    const existing = key ? byKey.get(key) : undefined
    if (existing) {
      existing.copies.push(entry)
      continue
    }
    const item = { entry, copies: [entry] }
    if (key) byKey.set(key, item)
    items.push(item)
  }
  return items
}

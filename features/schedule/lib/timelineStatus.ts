import type { LessonTask } from '@/features/plan/types'
import type { ScheduleEntry } from '../types'

export type TimelineDisplayStatus = 'completed' | 'in_progress' | 'planned' | 'skipped' | 'none'

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}

export function deriveLessonTimelineStatus(
  lesson: LessonTask,
  startTime: string,
  endTime: string,
  currentTime: string,
): TimelineDisplayStatus {
  if (lesson.status === 'completed') return 'completed'
  if (lesson.status === 'skipped') return 'skipped'

  const now = toMinutes(currentTime)
  const start = toMinutes(startTime)
  const end = toMinutes(endTime)

  if (now >= start && now < end) return 'in_progress'
  return 'planned'
}

export function getEntryTimelineStatus(
  entry: ScheduleEntry,
  currentTime: string,
): TimelineDisplayStatus {
  if (entry.kind !== 'lesson') return 'none'
  return deriveLessonTimelineStatus(entry.lesson, entry.startTime, entry.endTime, currentTime)
}

export function countInProgressLessons(
  entries: ScheduleEntry[],
  currentTime: string,
): number {
  const now = toMinutes(currentTime)
  return entries.filter(entry => {
    if (entry.kind !== 'lesson') return false
    if (entry.lesson.status !== 'not_started') return false
    return toMinutes(entry.startTime) <= now
  }).length
}

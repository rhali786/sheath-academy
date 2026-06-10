import type { LessonTask } from '@/features/plan/types'

type WindowLesson = Pick<LessonTask, 'dueDate' | 'plannedStartDate'>

export function getLessonWindowStart(lesson: WindowLesson): string {
  return lesson.plannedStartDate ?? lesson.dueDate
}

/** True when dateStr falls within [plannedStartDate ?? dueDate, dueDate]. */
export function lessonSpansDate(lesson: WindowLesson, dateStr: string): boolean {
  return dateStr >= getLessonWindowStart(lesson) && dateStr <= lesson.dueDate
}

/** True when lesson completion window overlaps [rangeStart, rangeEnd] (inclusive). */
export function lessonOverlapsRange(
  lesson: { dueDate: string | null; plannedStartDate?: string | null },
  rangeStart: string,
  rangeEnd: string,
): boolean {
  if (!lesson.dueDate) return false
  const windowStart = lesson.plannedStartDate ?? lesson.dueDate
  return windowStart <= rangeEnd && lesson.dueDate >= rangeStart
}

export function formatCompletionWindow(lesson: WindowLesson): string | null {
  if (!lesson.plannedStartDate || lesson.plannedStartDate === lesson.dueDate) return null
  const fmt = (d: string) =>
    new Date(`${d}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  return `${fmt(lesson.plannedStartDate)} – ${fmt(lesson.dueDate)}`
}

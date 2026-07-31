import type { LessonTask } from '@/features/plan/types'
import { lessonSpansDate } from '@/features/plan/utils/lessonCompletionWindow'

/**
 * Lessons visible on the Dashboard for a given date, including multi-day lessons whose
 * plannedStartDate..dueDate window covers that date (not only lessons due exactly on it).
 */
export function selectDayLessons(lessons: LessonTask[], dateStr: string): LessonTask[] {
  return lessons.filter(l => lessonSpansDate(l, dateStr)).sort((a, b) => a.order - b.order)
}

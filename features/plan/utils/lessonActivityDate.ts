import type { LessonTask } from '@/features/plan/types'

/** Date (YYYY-MM-DD) used for charts and weekly activity counts. */
export function getLessonActivityDate(lesson: LessonTask): string {
  if (lesson.completedAt) return lesson.completedAt.slice(0, 10)
  if (lesson.dueDate) return lesson.dueDate.slice(0, 10)
  return lesson.updatedAt.slice(0, 10)
}

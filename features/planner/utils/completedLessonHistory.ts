import type { LessonTask } from '@/features/lib/types'

export interface LessonHistoryOptions {
  childId?: string
  subjectId?: string
  startDate?: string
  endDate?: string
  showPending?: boolean
  showAll?: boolean
  limit?: number
}

export function getCompletedLessonHistory(
  lessons: LessonTask[],
  options: LessonHistoryOptions = {}
): LessonTask[] {
  const { childId, subjectId, startDate, endDate, showPending, showAll, limit } = options

  let result = lessons

  if (!showAll && !showPending) {
    result = result.filter(l => l.isCompleted)
  }

  if (childId) result = result.filter(l => l.childId === childId)
  if (subjectId) result = result.filter(l => l.subjectId === subjectId)
  if (startDate) result = result.filter(l => l.dueDate >= startDate)
  if (endDate) result = result.filter(l => l.dueDate <= endDate)

  result = result.sort((a, b) => b.dueDate.localeCompare(a.dueDate))

  if (limit !== undefined) result = result.slice(0, limit)

  return result
}

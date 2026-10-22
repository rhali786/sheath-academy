import type { LessonTask, LessonTaskStatus } from '@/features/plan/types'

/**
 * Status filter values the Lessons page dropdown can be set to. 'overdue' is
 * NOT a persisted LessonTaskStatus — it's derived (not_started + past due) —
 * so it is intentionally kept out of features/plan/types.ts to avoid leaking
 * a non-storable value into the write path.
 */
export type LessonStatusFilter = LessonTaskStatus | 'overdue' | ''

/**
 * Whether a lesson matches the given status filter. `today` is the
 * household-local date (YYYY-MM-DD) — pass it in rather than computing it
 * here so callers control the timezone.
 */
export function matchesStatusFilter(
  lesson: Pick<LessonTask, 'status' | 'dueDate'>,
  filter: LessonStatusFilter,
  today: string,
): boolean {
  if (!filter) return true
  if (filter === 'overdue') {
    return lesson.status === 'not_started' && lesson.dueDate < today
  }
  return lesson.status === filter
}

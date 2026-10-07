import type { RecurringScheduleBlock } from '@/features/subjects/types'

/** Course id → that course's recurring weekly time blocks (Settings → Courses). */
export type CourseTimes = Record<string, RecurringScheduleBlock[]>

/**
 * Builds the `courseTimes` schedule setting from courses (client `SubjectCourse` or server
 * subject rows — both carry `id` + `recurringSchedule`). Courses without blocks are omitted.
 */
export function courseTimesFromSubjects(
  subjects: { id: string; recurringSchedule?: RecurringScheduleBlock[] | null }[],
): CourseTimes {
  const result: CourseTimes = {}
  for (const s of subjects) {
    if (s.recurringSchedule && s.recurringSchedule.length > 0) result[s.id] = s.recurringSchedule
  }
  return result
}

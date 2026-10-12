import type { RecurringScheduleBlock } from '@/features/subjects/types'
import type { DayOfWeek } from '@/features/lib/types'

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

const WEEKDAYS: DayOfWeek[] = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

/** Weekday of a YYYY-MM-DD date, read as a local calendar date (never UTC). */
export function weekdayOf(date: string): DayOfWeek {
  const [y, m, d] = date.split('-').map(Number)
  return WEEKDAYS[new Date(y, m - 1, d).getDay()]
}

/**
 * The course time block that applies to a lesson on `date` — the same rule the schedule
 * uses to place a lesson that has no time of its own. Null when the course has no block
 * on that weekday.
 */
export function courseTimeFor(
  courseTimes: CourseTimes | undefined,
  subjectId: string,
  date: string,
): RecurringScheduleBlock | null {
  if (!date || !courseTimes) return null
  const weekday = weekdayOf(date)
  return courseTimes[subjectId]?.find(b => b.daysOfWeek.includes(weekday)) ?? null
}

/** The time an untimed lesson starts from when its course has no time that day. */
export const DAY_START = '08:30'

function formatTime12(time: string): string {
  const [h, m] = time.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 === 0 ? 12 : h % 12
  return `${hour}:${String(m).padStart(2, '0')} ${period}`
}

/**
 * One sentence for the lesson editors explaining where a lesson without its own time will
 * sit on the schedule (UAT 2.5 / 3.7: a lesson sat at 8:30 with nothing saying why).
 * Null when the lesson has its own time (it always wins) or there is no course/date.
 */
export function describeLessonTime(input: {
  courseName: string
  blocks: RecurringScheduleBlock[] | null | undefined
  date: string
  ownStart?: string | null
  ownEnd?: string | null
}): string | null {
  const { courseName, blocks, date, ownStart, ownEnd } = input
  if (ownStart && ownEnd) return null
  if (!courseName || !date) return null
  const weekday = weekdayOf(date)
  const block = blocks?.find(b => b.daysOfWeek.includes(weekday))
  if (block) return `Uses ${courseName}'s time on ${weekday}s: ${formatTime12(block.startTime)}.`
  const dayOrder = `so this lesson takes its place in the day's order (from ${formatTime12(DAY_START)})`
  if (blocks && blocks.length > 0) return `${courseName} has no set time on ${weekday}s, ${dayOrder}.`
  return `${courseName} has no weekly time, ${dayOrder}.`
}

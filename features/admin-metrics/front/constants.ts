import type { DropOffSignal } from '@/features/admin-metrics/types'

export const DROP_OFF_LABELS: Record<DropOffSignal, string> = {
  learners_no_activity: 'Learners created, no activity',
  started_not_completed: 'Started session, not completed',
  activity_no_evidence: 'Learning activity, no evidence',
  records_no_report: 'Records exist, no report generated',
  inactive_30_days: 'Inactive 30+ days',
}

/** Counts usage events: session_started, session_completed, lesson_completed, session_abandoned. */
export const SESSION_EVENTS_LABEL = 'Session events'
export const SESSION_EVENTS_HELP =
  'Usage events in the selected period: session started, completed, abandoned, and lesson completed. Not attendance check-ins or Qur\'an session records.'

export const LESSONS_LABEL = 'Lessons (planner)'
export const LESSONS_HELP =
  'Planner lesson tasks with due date in the selected period; completed count uses status completed.'

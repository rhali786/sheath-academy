import type { DropOffSignal } from '@/features/admin-metrics/types'

export const DROP_OFF_LABELS: Record<DropOffSignal, string> = {
  learners_no_activity: 'Learners exist — no activity this period',
  started_not_completed: 'Lessons started, not completed',
  activity_no_evidence: 'Learning activity, no portfolio evidence',
  records_no_report: 'Records exist, no report generated',
  inactive_30_days: 'Inactive 30+ days',
}

export const LESSONS_LABEL = 'Lessons'
export const LESSONS_HELP =
  'Lesson tasks with due date in the selected period; completed count reflects tasks with status = completed.'

export const ACTIVITY_LABEL = 'Activity (lessons + Qur\'an)'
export const ACTIVITY_HELP =
  'Total lesson tasks + Qur\'an sessions logged in the selected period.'

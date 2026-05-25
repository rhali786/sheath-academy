import type { LessonTask } from '@/features/plan/types'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { countInProgressLessons } from '@/features/schedule/lib/timelineStatus'

export interface TaskMetricsInput {
  today: string
  currentTime: string
  todayLessons: LessonTask[]
  overdueLessons: LessonTask[]
  attendanceMarkedCount: number
  quranSessionCount: number
  scheduleStartTime?: string
}


export function computeTaskMetrics(input: TaskMetricsInput): {
  tasksCompleted: number
  tasksInProgress: number
  tasksOverdue: number
} {
  const completedLessons = input.todayLessons.filter(l => l.status === 'completed').length
  const tasksCompleted =
    completedLessons + input.attendanceMarkedCount + input.quranSessionCount

  const tasksOverdue = input.overdueLessons.filter(
    l => l.dueDate && l.dueDate < input.today && l.status !== 'completed' && l.status !== 'skipped',
  ).length

  const sortedToday = [...input.todayLessons].sort((a, b) => a.order - b.order)
  const schedule = buildDailySchedule(sortedToday, {
    startTime: input.scheduleStartTime ?? '08:30',
    transitionMinutes: 10,
    defaultDurationMinutes: 30,
    includeSyntheticBreaks: true,
  })

  const tasksInProgress = countInProgressLessons(schedule.entries, input.currentTime)

  return { tasksCompleted, tasksInProgress, tasksOverdue }
}

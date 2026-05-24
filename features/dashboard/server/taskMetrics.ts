import type { LessonTask } from '@/features/plan/types'
import { buildDailySchedule } from '@/features/schedule/server/service'

export interface TaskMetricsInput {
  today: string
  currentTime: string
  todayLessons: LessonTask[]
  overdueLessons: LessonTask[]
  attendanceMarkedCount: number
  quranSessionCount: number
  scheduleStartTime?: string
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
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
  })

  const now = toMinutes(input.currentTime)
  let tasksInProgress = 0
  for (const block of schedule.blocks) {
    const start = toMinutes(block.startTime)
    const end = toMinutes(block.endTime)
    if (start <= now && now < end && block.lesson.status !== 'completed') {
      tasksInProgress = 1
      break
    }
  }

  return { tasksCompleted, tasksInProgress, tasksOverdue }
}

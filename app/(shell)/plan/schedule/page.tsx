import { SchedulePage } from '@/features/schedule/front/pages/SchedulePage'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { getLessons } from '@/features/plan/server/service'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function ScheduleRoute() {
  const today = todayStr()
  const allLessons = getLessons()
  const todayLessons = allLessons
    .filter(l => l.dueDate === today)
    .sort((a, b) => a.order - b.order)

  const schedule = buildDailySchedule(todayLessons, {
    startTime: '08:30',
    transitionMinutes: 10,
    defaultDurationMinutes: 30,
  })

  return <SchedulePage schedule={schedule} />
}

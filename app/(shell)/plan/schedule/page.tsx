import { SchedulePage } from '@/features/schedule/front/pages/SchedulePage'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import type { LessonTask } from '@/features/plan/types'
import { getHouseholdContext } from '@/features/lib/server/tenant'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default async function ScheduleRoute() {
  const today = todayStr()

  let todayLessons: LessonTask[] = []
  try {
    const { householdId } = await getHouseholdContext()
    const rows = await listLessonTaskRows(householdId, { startDate: today, endDate: today })
    todayLessons = rows
      .map(r => ({
        id: r.id, childId: r.learnerId, subjectId: r.subjectId ?? '', householdId: r.householdId,
        title: r.title, description: r.description ?? undefined, dueDate: r.dueDate ?? '',
        status: (r.status as LessonTask['status']) ?? 'not_started', order: r.sortOrder,
        createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
        updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
      }))
      .sort((a, b) => a.order - b.order)
  } catch {
    // unauthenticated or DB unavailable — render empty schedule
  }

  const schedule = buildDailySchedule(todayLessons, {
    startTime: '08:30',
    transitionMinutes: 10,
    defaultDurationMinutes: 30,
  })

  return <SchedulePage schedule={schedule} />
}

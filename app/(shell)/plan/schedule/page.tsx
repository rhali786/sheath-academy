import { SchedulePage } from '@/features/schedule/front/pages/SchedulePage'
import { buildDailySchedule } from '@/features/schedule/server/service'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import type { LessonTask } from '@/features/plan/types'
import { getAuthCtx } from '@/features/auth/server/context'

type ScheduleRouteProps = {
  searchParams?: Promise<{ date?: string | string[] | undefined }>
}

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isValidDateParam(dateStr: string | undefined): dateStr is string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [year, month, day] = dateStr.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}-${String(parsed.getDate()).padStart(2, '0')}` === dateStr
}

export default async function ScheduleRoute({ searchParams }: ScheduleRouteProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined
  const rawDate = resolvedSearchParams?.date
  const requestedDate = Array.isArray(rawDate) ? rawDate[0] : rawDate
  const selectedDate = isValidDateParam(requestedDate) ? requestedDate : todayStr()

  let todayLessons: LessonTask[] = []
  try {
    const ctx = await getAuthCtx()
    if (!ctx) throw new Error('Unauthenticated')
    const rows = await listLessonTaskRows(ctx.householdId, { startDate: selectedDate, endDate: selectedDate })
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
    includeSyntheticBreaks: true,
  })

  return <SchedulePage schedule={{ ...schedule, date: selectedDate }} />
}

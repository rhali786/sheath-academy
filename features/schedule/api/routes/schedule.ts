import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { buildDailySchedule, getScheduleTemplates } from '@/features/schedule/server/service'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { mapLessonTaskRow } from '@/features/plan/api/mapLessonTaskRow'
import { listSubjectRows } from '@/features/subjects/server/repository'
import { courseTimesFromSubjects } from '@/features/schedule/lib/courseTimes'
import type { ScheduleSettings } from '@/features/schedule/types'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const DEFAULT_SETTINGS: ScheduleSettings = {
  startTime: '08:30',
  transitionMinutes: 10,
  defaultDurationMinutes: 30,
}

export async function handleScheduleToday(request: Request): Promise<NextResponse> {
  const { householdId } = getRequestAuthCtx()
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined

  const today = todayStr()
  const [rows, subjectRows] = await Promise.all([
    listLessonTaskRows(householdId, {
      learnerId: childId,
      startDate: today,
      endDate: today,
    }),
    listSubjectRows(householdId),
  ])
  // Shared mapper keeps scheduledStartTime/EndTime, so a lesson's own time beats its course time.
  const lessons = rows.map(mapLessonTaskRow).sort((a, b) => a.order - b.order)
  const schedule = buildDailySchedule(lessons, {
    ...DEFAULT_SETTINGS,
    date: today,
    courseTimes: courseTimesFromSubjects(subjectRows),
  })

  return NextResponse.json({
    status: 'success',
    data: schedule,
    message: 'OK',
    timestamp: new Date().toISOString(),
  })
}

export async function handleScheduleTemplates(): Promise<NextResponse> {
  return NextResponse.json({
    status: 'success',
    data: getScheduleTemplates(),
    message: 'OK',
    timestamp: new Date().toISOString(),
  })
}

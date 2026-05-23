import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { buildDailySchedule, getScheduleTemplates } from '@/features/schedule/server/service'
import { listLessonTaskRows, type LessonTaskRow } from '@/features/plan/server/repository'
import type { LessonTask } from '@/features/plan/types'
import type { ScheduleSettings } from '@/features/schedule/types'

function todayStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function toIso(v: Date | string): string {
  return v instanceof Date ? v.toISOString() : v
}

function mapRow(row: LessonTaskRow): LessonTask {
  return {
    id: row.id,
    childId: row.learnerId,
    subjectId: row.subjectId ?? '',
    householdId: row.householdId,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.dueDate ?? '',
    status: row.status as LessonTask['status'],
    order: row.sortOrder,
    createdAt: toIso(row.createdAt),
    updatedAt: toIso(row.updatedAt),
  }
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
  const rows = await listLessonTaskRows(householdId, {
    learnerId: childId,
    startDate: today,
    endDate: today,
  })
  const lessons = rows.map(mapRow).sort((a, b) => a.order - b.order)
  const schedule = buildDailySchedule(lessons, DEFAULT_SETTINGS)

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

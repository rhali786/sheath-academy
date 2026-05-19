import { NextResponse } from 'next/server'
import { buildDailySchedule, getScheduleTemplates } from '@/features/schedule/server/service'
import { getLessons } from '@/features/plan/server/service'
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
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined

  const today = todayStr()
  const allLessons = getLessons(childId)
  const lessons = allLessons.filter(l => l.dueDate === today)
  const sorted = [...lessons].sort((a, b) => a.order - b.order)
  const schedule = buildDailySchedule(sorted, DEFAULT_SETTINGS)

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

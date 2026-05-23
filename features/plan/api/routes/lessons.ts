import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { listLessonTaskRows, createLessonTaskRow } from '@/features/plan/server/repository'
import type { LessonTaskRow } from '@/features/plan/server/repository'
import { guardOwnership, assertSessionOwnership, sessionAuthCtx } from '@/features/auth/server/routeOwnership'
import { getHouseholdContext } from '@/features/lib/server/tenant'

function rowToLesson(r: LessonTaskRow): LessonTask {
  return {
    id: r.id,
    childId: r.learnerId,
    subjectId: r.subjectId ?? '',
    householdId: r.householdId,
    title: r.title,
    description: r.description ?? undefined,
    dueDate: r.dueDate ?? '',
    status: (r.status as LessonTask['status']) ?? 'not_started',
    order: r.sortOrder,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

function formatLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getWeekRange(weekStr: string): { start: string; end: string } | null {
  const d = new Date(`${weekStr}T00:00:00`)
  if (isNaN(d.getTime())) return null
  const dayOfWeek = d.getDay()
  const offsetToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(d)
  monday.setDate(d.getDate() + offsetToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  return { start: formatLocalDate(monday), end: formatLocalDate(sunday) }
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<LessonTask[] | null>>> {
  const url = new URL(request.url)
  const week = url.searchParams.get('week')
  const childIds = url.searchParams.get('childIds')
  const subjectIds = url.searchParams.get('subjectIds')

  let weekRange: { start: string; end: string } | null = null
  if (week) {
    weekRange = getWeekRange(week)
    if (!weekRange) return NextResponse.json({ status: 'error', data: null, message: 'Invalid week parameter — expected YYYY-MM-DD', timestamp: new Date().toISOString() }, { status: 400 })
  }

  const childIdArray = childIds ? childIds.split(',').filter(Boolean) : undefined
  const subjectIdArray = subjectIds ? subjectIds.split(',').filter(Boolean) : undefined

  try {
    const { householdId } = await getHouseholdContext()
    const filters: Parameters<typeof listLessonTaskRows>[1] = {}
    if (childIdArray?.length === 1) filters.learnerId = childIdArray[0]
    if (subjectIdArray?.length === 1) filters.subjectId = subjectIdArray[0]
    if (weekRange) { filters.startDate = weekRange.start; filters.endDate = weekRange.end }
    let rows = await listLessonTaskRows(householdId, filters)
    if (childIdArray && childIdArray.length > 1) rows = rows.filter(r => childIdArray.includes(r.learnerId))
    if (subjectIdArray && subjectIdArray.length > 1) rows = rows.filter(r => r.subjectId && subjectIdArray.includes(r.subjectId))
    return NextResponse.json({ status: 'success', data: rows.map(rowToLesson), message: 'Lessons retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Lessons retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const body = await request.json()
  const { childId, subjectId, title, dueDate, description } = body

  if (!childId || !title?.trim() || !dueDate) {
    return NextResponse.json({ status: 'error', data: null, message: 'childId, title, and dueDate are required', timestamp: new Date().toISOString() }, { status: 400 })
  }

  return guardOwnership(async () => {
    await assertSessionOwnership('learner', childId)
    const { householdId, userId } = await sessionAuthCtx()
    const row = await createLessonTaskRow(householdId, {
      learnerId: childId,
      subjectId,
      title: title.trim(),
      description: description?.trim(),
      dueDate,
      status: body.status ?? 'not_started',
      sortOrder: body.order || 0,
    })
    const { trackSessionStarted } = await import('@/features/admin-metrics/server/instrument')
    void trackSessionStarted(userId, householdId, childId, row.id, 'planner')
    return NextResponse.json(
      { status: 'success', data: rowToLesson(row), message: 'Lesson created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  }) as Promise<NextResponse<ApiResponse<LessonTask | null>>>
}

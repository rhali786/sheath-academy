import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { listLessonTaskRows, createLessonTaskRow, createLessonTasksFanOut, type LessonAssignmentInput } from '@/features/plan/server/repository'
import { mapLessonTaskRow } from '@/features/plan/api/mapLessonTaskRow'
import { guardOwnership, assertSessionOwnership } from '@/features/auth/server/routeOwnership'

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

function isValidDateParam(dateStr: string | null): dateStr is string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [year, month, day] = dateStr.split('-').map(Number)
  const parsed = new Date(year, month - 1, day)
  return formatLocalDate(parsed) === dateStr
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<LessonTask[] | null>>> {
  const url = new URL(request.url)
  const week = url.searchParams.get('week')
  const startDate = url.searchParams.get('startDate')
  const endDate = url.searchParams.get('endDate')
  const childIds = url.searchParams.get('childIds')
  const subjectIds = url.searchParams.get('subjectIds')

  let weekRange: { start: string; end: string } | null = null
  if (week) {
    weekRange = getWeekRange(week)
    if (!weekRange) return NextResponse.json({ status: 'error', data: null, message: 'Invalid week parameter — expected YYYY-MM-DD', timestamp: new Date().toISOString() }, { status: 400 })
  }

  if ((startDate && !isValidDateParam(startDate)) || (endDate && !isValidDateParam(endDate))) {
    return NextResponse.json({ status: 'error', data: null, message: 'Invalid startDate or endDate parameter — expected YYYY-MM-DD', timestamp: new Date().toISOString() }, { status: 400 })
  }

  const childIdArray = childIds ? childIds.split(',').filter(Boolean) : undefined
  const subjectIdArray = subjectIds ? subjectIds.split(',').filter(Boolean) : undefined

  try {
    const { householdId } = getRequestAuthCtx()
    const filters: Parameters<typeof listLessonTaskRows>[1] = {}
    if (childIdArray?.length === 1) filters.learnerId = childIdArray[0]
    if (subjectIdArray?.length === 1) filters.subjectId = subjectIdArray[0]
    if (startDate) filters.startDate = startDate
    if (endDate) filters.endDate = endDate
    if (weekRange && !startDate && !endDate) {
      filters.startDate = weekRange.start
      filters.endDate = weekRange.end
    }
    let rows = await listLessonTaskRows(householdId, filters)
    if (childIdArray && childIdArray.length > 1) rows = rows.filter(r => childIdArray.includes(r.learnerId))
    if (subjectIdArray && subjectIdArray.length > 1) rows = rows.filter(r => r.subjectId && subjectIdArray.includes(r.subjectId))
    return NextResponse.json({ status: 'success', data: rows.map(mapLessonTaskRow), message: 'Lessons retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Lessons retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const body = await request.json()
  const { childId, childIds, assignments, subjectId, title, dueDate, description } = body
  const learnerIds: string[] = Array.isArray(childIds) && childIds.length > 0
    ? childIds
    : childId
      ? [childId]
      : []

  if (learnerIds.length === 0 || !title?.trim() || !dueDate) {
    return NextResponse.json({ status: 'error', data: null, message: 'childId, title, and dueDate are required', timestamp: new Date().toISOString() }, { status: 400 })
  }

  return guardOwnership(async () => {
    for (const learnerId of learnerIds) {
      await assertSessionOwnership('learner', learnerId)
    }
    const { householdId, userId } = getRequestAuthCtx()
    const shared = {
      title: title.trim(),
      description: description?.trim(),
      resourceLink: body.resourceLink?.trim() || undefined,
      lessonType: body.lessonType || undefined,
      estimatedDuration: body.estimatedDuration || undefined,
      plannedStartDate: body.plannedStartDate || undefined,
      dueDate,
      status: body.status ?? 'not_started',
      sortOrder: body.order || 0,
    }

    if (learnerIds.length >= 2) {
      const rawAssignments = Array.isArray(assignments) && assignments.length > 0
        ? assignments.map((a: { learnerId?: string; childId?: string; subjectId?: string }) => ({
            learnerId: a.learnerId ?? a.childId ?? '',
            subjectId: a.subjectId,
          }))
        : learnerIds.map((learnerId: string) => ({ learnerId, subjectId }))
      const assignmentRows: LessonAssignmentInput[] = rawAssignments.filter(a => a.learnerId)
      const rows = await createLessonTasksFanOut(householdId, shared, assignmentRows)
      const { trackSessionStarted } = await import('@/features/admin-metrics/server/instrument')
      for (const row of rows) {
        void trackSessionStarted(userId, householdId, row.learnerId, row.id, 'planner')
      }
      return NextResponse.json(
        { status: 'success', data: mapLessonTaskRow(rows[0]), message: 'Lessons created', timestamp: new Date().toISOString() },
        { status: 201 },
      )
    }

    const row = await createLessonTaskRow(householdId, {
      learnerId: learnerIds[0],
      subjectId,
      ...shared,
    })
    const { trackSessionStarted } = await import('@/features/admin-metrics/server/instrument')
    void trackSessionStarted(userId, householdId, learnerIds[0], row.id, 'planner')
    return NextResponse.json(
      { status: 'success', data: mapLessonTaskRow(row), message: 'Lesson created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  }) as Promise<NextResponse<ApiResponse<LessonTask | null>>>
}

import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { getLessonTaskRow, updateLessonTaskRow, completeLessonTaskRow, deleteLessonTaskRow } from '@/features/plan/server/repository'
import { mapLessonTaskRow } from '@/features/plan/api/mapLessonTaskRow'
import { notFoundResponse } from '@/features/auth/server/context'
import { validateLessonWindow, validateScheduleTimeWindow } from '@/features/plan/server/validation'

function rowToLesson(r: Parameters<typeof mapLessonTaskRow>[0]): LessonTask {
  return mapLessonTaskRow(r)
}

export async function GET(id: string): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const row = await getLessonTaskRow(id, householdId)
    if (!row) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToLesson(row), message: 'Lesson retrieved', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function PUT(id: string, request: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const body = await request.json()

  if (body.dueDate) {
    const windowCheck = validateLessonWindow(body.plannedStartDate ?? null, body.dueDate)
    if (!windowCheck.valid) {
      return NextResponse.json(
        { status: 'error', data: null, message: windowCheck.error ?? 'Invalid date range', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }
  }

  if ('scheduledStartTime' in body || 'scheduledEndTime' in body) {
    const timeCheck = validateScheduleTimeWindow(body.scheduledStartTime ?? null, body.scheduledEndTime ?? null)
    if (!timeCheck.valid) {
      return NextResponse.json(
        { status: 'error', data: null, message: timeCheck.error ?? 'Invalid schedule time range', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateLessonTaskRow(id, householdId, {
      title: body.title?.trim(),
      description: body.description?.trim(),
      resourceLink: body.resourceLink?.trim(),
      lessonType: body.lessonType,
      estimatedDuration: body.estimatedDuration,
      scheduledStartTime: 'scheduledStartTime' in body ? (body.scheduledStartTime ?? null) : undefined,
      scheduledEndTime: 'scheduledEndTime' in body ? (body.scheduledEndTime ?? null) : undefined,
      plannedStartDate: body.plannedStartDate ?? null,
      dueDate: body.dueDate,
      status: body.status,
      sortOrder: body.order,
      curriculum: 'curriculum' in body ? (body.curriculum?.trim() || null) : undefined,
      chapter: 'chapter' in body ? (body.chapter?.trim() || null) : undefined,
      hasHomework: 'hasHomework' in body ? body.hasHomework === true : undefined,
      hasAssessment: 'hasAssessment' in body ? body.hasAssessment === true : undefined,
    }, { applyToGroup: body.applyToGroup === true })
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToLesson(updated), message: 'Lesson updated', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function COMPLETE(id: string, request?: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  let status: 'completed' | 'skipped' = 'completed'
  if (request) {
    try { const body = await request.json(); if (body?.status === 'skipped') status = 'skipped' } catch {}
  }
  try {
    const { householdId, userId } = getRequestAuthCtx()
    const done = await completeLessonTaskRow(id, householdId, status)
    if (!done) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    if (status === 'completed') {
      const { trackLessonCompleted } = await import('@/features/admin-metrics/server/instrument')
      void trackLessonCompleted(userId, householdId, done.learnerId, done.id)
    }
    return NextResponse.json({ status: 'success', data: rowToLesson(done), message: status === 'skipped' ? 'Lesson marked as skipped' : 'Lesson marked as complete', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function DELETE(id: string, request?: Request): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const deleteGroup = request
      ? new URL(request.url).searchParams.get('deleteGroup') === 'true'
      : false
    const deleted = await deleteLessonTaskRow(id, householdId, { deleteGroup })
    if (!deleted) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Lesson deleted', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { getLessonTaskRow, updateLessonTaskRow, completeLessonTaskRow, deleteLessonTaskRow } from '@/features/plan/server/repository'
import type { LessonTaskRow } from '@/features/plan/server/repository'
import { getHouseholdContext } from '@/features/lib/server/tenant'
import { notFoundResponse } from '@/features/auth/server/context'

function rowToLesson(r: LessonTaskRow): LessonTask {
  return {
    id: r.id, childId: r.learnerId, subjectId: r.subjectId ?? '', householdId: r.householdId,
    title: r.title, description: r.description ?? undefined, dueDate: r.dueDate ?? '',
    status: (r.status as LessonTask['status']) ?? 'not_started', order: r.sortOrder,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(id: string): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  try {
    const { householdId } = await getHouseholdContext()
    const row = await getLessonTaskRow(id, householdId)
    if (!row) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToLesson(row), message: 'Lesson retrieved', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function PUT(id: string, request: Request): Promise<NextResponse<ApiResponse<LessonTask | null>>> {
  const body = await request.json()
  try {
    const { householdId } = await getHouseholdContext()
    const updated = await updateLessonTaskRow(id, householdId, { title: body.title?.trim(), description: body.description?.trim(), dueDate: body.dueDate, status: body.status, sortOrder: body.order })
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
    const { householdId, userId } = await getHouseholdContext()
    const done = await completeLessonTaskRow(id, householdId, status)
    if (!done) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    if (status === 'completed') {
      const { trackLessonCompleted } = await import('@/features/admin-metrics/server/instrument')
      void trackLessonCompleted(userId, householdId, done.learnerId, done.id)
    }
    return NextResponse.json({ status: 'success', data: rowToLesson(done), message: status === 'skipped' ? 'Lesson marked as skipped' : 'Lesson marked as complete', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = await getHouseholdContext()
    const deleted = await deleteLessonTaskRow(id, householdId)
    if (!deleted) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Lesson deleted', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

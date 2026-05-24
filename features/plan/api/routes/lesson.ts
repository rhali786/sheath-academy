import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { getLessonTaskRow, updateLessonTaskRow, completeLessonTaskRow, deleteLessonTaskRow } from '@/features/plan/server/repository'
import { mapLessonTaskRow } from '@/features/plan/api/mapLessonTaskRow'
import { notFoundResponse } from '@/features/auth/server/context'

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
  try {
    const { householdId } = getRequestAuthCtx()
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

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const deleted = await deleteLessonTaskRow(id, householdId)
    if (!deleted) return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Lesson deleted', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Lesson not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

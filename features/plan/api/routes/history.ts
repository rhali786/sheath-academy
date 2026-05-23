import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import type { LessonTaskRow } from '@/features/plan/server/repository'
import { getCompletedLessonHistory } from '@/features/plan/utils/completedLessonHistory'
import { getHouseholdContext } from '@/features/lib/server/tenant'

function rowToLesson(r: LessonTaskRow): LessonTask {
  return {
    id: r.id, childId: r.learnerId, subjectId: r.subjectId ?? '', householdId: r.householdId,
    title: r.title, description: r.description ?? undefined, dueDate: r.dueDate ?? '',
    status: (r.status as LessonTask['status']) ?? 'not_started', order: r.sortOrder,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<LessonTask[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const subjectId = url.searchParams.get('subjectId') ?? undefined
  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined
  const limitParam = url.searchParams.get('limit')
  const showAll = url.searchParams.get('showAll') === 'true'
  const showPending = url.searchParams.get('showPending') === 'true'

  let limit: number | undefined
  if (limitParam !== null) {
    limit = parseInt(limitParam, 10)
    if (isNaN(limit) || limit < 1) {
      return NextResponse.json({ status: 'error', data: [], message: 'limit must be a positive integer', timestamp: new Date().toISOString() }, { status: 400 })
    }
  }

  try {
    const { householdId } = await getHouseholdContext()
    const rows = await listLessonTaskRows(householdId, { learnerId: childId, subjectId, startDate, endDate })
    const lessons = rows.map(rowToLesson)
    const result = getCompletedLessonHistory(lessons, { childId, subjectId, startDate, endDate, showPending, showAll, limit })
    return NextResponse.json({ status: 'success', data: result, message: 'Lesson history retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Lesson history retrieved', timestamp: new Date().toISOString() })
  }
}

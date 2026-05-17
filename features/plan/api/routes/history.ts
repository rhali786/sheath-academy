import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { LessonTask } from '@/features/plan/types'
import { getLessons } from '@/features/plan/server/service'
import { getCompletedLessonHistory } from '@/features/plan/utils/completedLessonHistory'

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
      return NextResponse.json(
        { status: 'error', data: [], message: 'limit must be a positive integer', timestamp: new Date().toISOString() },
        { status: 400 }
      )
    }
  }

  const lessons = getLessons()
  const result = getCompletedLessonHistory(lessons, {
    childId,
    subjectId,
    startDate,
    endDate,
    showPending,
    showAll,
    limit,
  })

  return NextResponse.json({
    status: 'success',
    data: result,
    message: 'Lesson history retrieved',
    timestamp: new Date().toISOString(),
  })
}

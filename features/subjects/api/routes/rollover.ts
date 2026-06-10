import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { rolloverCourses } from '@/features/subjects/server/rollover'
import type { SubjectRowWithLearners } from '@/features/subjects/server/repository'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message: string
  timestamp: string
}

function rowToSubject(r: SubjectRowWithLearners): SubjectCourse {
  return {
    id: r.id,
    childId: r.learnerIds[0] ?? r.learnerId ?? '',
    learnerIds: r.learnerIds,
    name: r.name,
    category: (r.category as SubjectCourseCategory) ?? 'core',
    schoolYearId: r.schoolYearId ?? undefined,
    isActive: r.isActive,
    order: r.sortOrder,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()
  const { fromYearId, toYearId, courseIds } = body

  if (!fromYearId || !toYearId) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'fromYearId and toYearId are required',
        timestamp: new Date().toISOString(),
      },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const rows = await rolloverCourses(householdId, fromYearId, toYearId, courseIds)
    return NextResponse.json(
      {
        status: 'success',
        data: rows.map(rowToSubject),
        message: 'Courses rolled over',
        timestamp: new Date().toISOString(),
      },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Failed to roll over courses',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

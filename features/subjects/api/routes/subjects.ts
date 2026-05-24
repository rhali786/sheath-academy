import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { listSubjectRows, createSubjectRow } from '@/features/subjects/server/repository'
import type { SubjectRow } from '@/features/subjects/server/repository'

interface ApiResponse<T> { status: 'success' | 'error'; data: T; message: string; timestamp: string }

function rowToSubject(r: SubjectRow): SubjectCourse {
  return {
    id: r.id,
    childId: r.learnerId ?? '',
    learnerIds: r.learnerId ? [r.learnerId] : [],
    name: r.name,
    category: (r.category as SubjectCourseCategory) ?? 'core',
    isActive: r.isActive,
    order: r.sortOrder,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<SubjectCourse[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined

  try {
    const { householdId } = getRequestAuthCtx()
    const rows = await listSubjectRows(householdId, childId)
    return NextResponse.json({ status: 'success', data: rows.map(rowToSubject), message: 'Subjects retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Subjects retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()
  const { childId, learnerIds, name, category } = body
  const hasLearner = (learnerIds && learnerIds.length > 0) || childId

  if (!hasLearner || !name?.trim() || !category) {
    return NextResponse.json({ status: 'error', data: null, message: 'learnerIds (or childId), name, and category are required', timestamp: new Date().toISOString() }, { status: 400 })
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const primaryLearnerId = (learnerIds && learnerIds[0]) ?? childId
    const row = await createSubjectRow(householdId, { name: name.trim(), category, learnerId: primaryLearnerId })
    return NextResponse.json({ status: 'success', data: rowToSubject(row), message: 'Subject created', timestamp: new Date().toISOString() }, { status: 201 })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Failed to create subject', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

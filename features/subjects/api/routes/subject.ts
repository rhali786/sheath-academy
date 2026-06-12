import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { getSubjectRow, updateSubjectRow, archiveSubjectRow } from '@/features/subjects/server/repository'
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
    resourceIds: r.resourceIds,
    name: r.name,
    category: (r.category as SubjectCourseCategory) ?? 'core',
    schoolYearId: r.schoolYearId ?? undefined,
    isActive: r.isActive,
    order: r.sortOrder,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(id: string): Promise<NextResponse<ApiResponse<SubjectCourse | null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const row = await getSubjectRow(id, householdId)
    if (!row) return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToSubject(row), message: 'Subject retrieved', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  const body = await request.json()
  try {
    const { householdId } = getRequestAuthCtx()
    const learnerIds: string[] | undefined =
      body.learnerIds?.length > 0
        ? body.learnerIds
        : body.childId
          ? [String(body.childId)]
          : undefined
    const updated = await updateSubjectRow(id, householdId, {
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      category: body.category as SubjectCourseCategory | undefined,
      sortOrder: body.order !== undefined ? Number(body.order) : undefined,
      learnerIds,
    })
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToSubject(updated), message: 'Subject updated', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function ARCHIVE(id: string): Promise<NextResponse> {
  try {
    const { householdId } = getRequestAuthCtx()
    const archived = await archiveSubjectRow(id, householdId)
    if (!archived) return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToSubject(archived), message: 'Subject archived', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function RESTORE(_id: string): Promise<NextResponse> {
  // Restore not yet supported in Postgres repository — pending migration
  return NextResponse.json({ status: 'error', data: null, message: 'Restore not yet implemented', timestamp: new Date().toISOString() }, { status: 501 })
}

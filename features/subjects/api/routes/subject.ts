import { NextResponse } from 'next/server'
import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { getSubjectRow, updateSubjectRow, archiveSubjectRow } from '@/features/subjects/server/repository'
import type { SubjectRow } from '@/features/subjects/server/repository'
import { getHouseholdContext } from '@/features/lib/server/tenant'

interface ApiResponse<T> {
  status: 'success' | 'error'
  data: T
  message: string
  timestamp: string
}

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

export async function GET(id: string): Promise<NextResponse<ApiResponse<SubjectCourse | null>>> {
  try {
    const { householdId } = await getHouseholdContext()
    const row = await getSubjectRow(id, householdId)
    if (!row) return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToSubject(row), message: 'Subject retrieved', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  const body = await request.json()
  try {
    const { householdId } = await getHouseholdContext()
    const updated = await updateSubjectRow(id, householdId, {
      name: body.name !== undefined ? String(body.name).trim() : undefined,
      category: body.category as SubjectCourseCategory | undefined,
      sortOrder: body.order !== undefined ? Number(body.order) : undefined,
    })
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToSubject(updated), message: 'Subject updated', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function ARCHIVE(id: string): Promise<NextResponse> {
  try {
    const { householdId } = await getHouseholdContext()
    const archived = await archiveSubjectRow(id, householdId)
    if (!archived) return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToSubject(archived), message: 'Subject archived', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Subject not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function RESTORE(_id: string): Promise<NextResponse> {
  // Restore not yet supported in Postgres repository — pending migration
  return NextResponse.json({ status: 'error', data: null, message: 'Restore not yet implemented', timestamp: new Date().toISOString() }, { status: 501 })
}

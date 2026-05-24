import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import { listLearners, listAllLearners, createLearner } from '@/features/children/server/repository'
import type { LearnerRow } from '@/features/children/server/repository'

function learnerRowToStudentProfile(row: LearnerRow): StudentProfile {
  return {
    id: row.id,
    householdId: row.householdId,
    name: row.name,
    gradeLabel: row.gradeLevel ?? '',
    username: '',
    password: '',
    isActive: row.isActive,
    avatarInitials: row.name.charAt(0).toUpperCase(),
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<StudentProfile[]>>> {
  const url = new URL(request.url)
  const includeArchived = url.searchParams.get('includeArchived') === 'true'

  try {
    const { householdId } = getRequestAuthCtx()
    const rows = includeArchived ? await listAllLearners(householdId) : await listLearners(householdId)
    return NextResponse.json({ status: 'success', data: rows.map(learnerRowToStudentProfile), message: 'Student profiles retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Student profiles retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  try {
    const { householdId, userId } = getRequestAuthCtx()
    const { name, gradeLabel } = body
    if (!name?.trim()) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'name is required', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }
    const row = await createLearner(householdId, { name: name.trim(), gradeLevel: gradeLabel?.trim() })
    const { trackLearnerCreated } = await import('@/features/admin-metrics/server/instrument')
    void trackLearnerCreated(userId, householdId, row.id)
    return NextResponse.json(
      { status: 'success', data: learnerRowToStudentProfile(row), message: 'Student profile created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to create student profile', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

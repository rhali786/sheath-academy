import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import { getStudentProfiles, createStudentProfile } from '@/features/children/server/service'
import { listLearners, createLearner } from '@/features/children/server/repository'
import { isPostgresMode } from '@/features/lib/server/db'
import { getHouseholdContext } from '@/features/lib/server/tenant'
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

  if (isPostgresMode()) {
    try {
      const { householdId } = await getHouseholdContext()
      const { listAllLearners } = await import('@/features/children/server/repository')
      const rows = includeArchived
        ? await listAllLearners(householdId)
        : await listLearners(householdId)
      const profiles = rows.map(learnerRowToStudentProfile)
      return NextResponse.json({ status: 'success', data: profiles, message: 'Student profiles retrieved', timestamp: new Date().toISOString() })
    } catch {
      return NextResponse.json({ status: 'success', data: [], message: 'Student profiles retrieved', timestamp: new Date().toISOString() })
    }
  }

  // Memory path
  const householdId = url.searchParams.get('householdId') as string | undefined
  let profiles = getStudentProfiles(householdId)
  if (!includeArchived) profiles = profiles.filter(p => p.isActive)
  return NextResponse.json({
    status: 'success',
    data: profiles,
    message: 'Student profiles retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  if (isPostgresMode()) {
    try {
      const { householdId } = await getHouseholdContext()
      const { name, gradeLabel } = body
      if (!name?.trim()) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'name is required', timestamp: new Date().toISOString() },
          { status: 400 }
        )
      }
      const row = await createLearner(householdId, { name: name.trim(), gradeLevel: gradeLabel?.trim() })
      return NextResponse.json(
        { status: 'success', data: learnerRowToStudentProfile(row), message: 'Student profile created', timestamp: new Date().toISOString() },
        { status: 201 }
      )
    } catch (e) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'Failed to create student profile', timestamp: new Date().toISOString() },
        { status: 500 }
      )
    }
  }

  // Memory path
  const { householdId, name, gradeLabel, username, password } = body
  if (!householdId || !name?.trim() || !gradeLabel?.trim() || !username?.trim() || !password) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'householdId, name, gradeLabel, username, and password are required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }
  const profile = createStudentProfile({
    householdId,
    name: name.trim(),
    gradeLabel: gradeLabel.trim(),
    dob: body.dob || undefined,
    teacherName: body.teacherName?.trim() || undefined,
    username: username.trim(),
    password: password.trim(),
    avatarInitials: body.avatarInitials,
  })
  return NextResponse.json(
    { status: 'success', data: profile, message: 'Student profile created', timestamp: new Date().toISOString() },
    { status: 201 }
  )
}

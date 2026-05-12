import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import { getStudentProfiles, createStudentProfile } from '@/features/children/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<StudentProfile[]>>> {
  const url = new URL(request.url)
  const includeArchived = url.searchParams.get('includeArchived') === 'true'
  const householdId = url.searchParams.get('householdId') as string | undefined

  let profiles = getStudentProfiles(householdId)

  if (!includeArchived) {
    profiles = profiles.filter(p => p.isActive)
  }

  return NextResponse.json({
    status: 'success',
    data: profiles,
    message: 'Student profiles retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  const { householdId, name, gradeLabel, username, password } = body

  // Validate required fields
  if (!householdId || !name?.trim() || !gradeLabel?.trim() || !username?.trim() || !password) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'householdId, name, gradeLabel, username, and password are required',
        timestamp: new Date().toISOString(),
      },
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
    {
      status: 'success',
      data: profile,
      message: 'Student profile created',
      timestamp: new Date().toISOString(),
    },
    { status: 201 }
  )
}

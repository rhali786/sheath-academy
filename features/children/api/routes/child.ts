import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import { getStudentProfile, updateStudentProfile, archiveStudentProfile, restoreStudentProfile } from '@/features/lib/server/dataStore'

export async function GET(id: string): Promise<NextResponse<ApiResponse<StudentProfile | null>>> {
  const profile = getStudentProfile(id)

  if (!profile) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Student profile not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  return NextResponse.json({
    status: 'success',
    data: profile,
    message: 'Student profile retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  const body = await request.json()

  const profile = getStudentProfile(id)
  if (!profile) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Student profile not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const updated = updateStudentProfile(id, {
    name: body.name !== undefined ? body.name.trim() : undefined,
    gradeLabel: body.gradeLabel !== undefined ? body.gradeLabel.trim() : undefined,
    dob: body.dob,
    teacherName: body.teacherName !== undefined ? body.teacherName?.trim() : undefined,
    username: body.username !== undefined ? body.username.trim() : undefined,
    password: body.password !== undefined ? body.password.trim() : undefined,
  })

  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Student profile updated',
    timestamp: new Date().toISOString(),
  })
}

export async function ARCHIVE(id: string): Promise<NextResponse> {
  const profile = getStudentProfile(id)
  if (!profile) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Student profile not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const archived = archiveStudentProfile(id)

  return NextResponse.json({
    status: 'success',
    data: archived,
    message: 'Student profile archived',
    timestamp: new Date().toISOString(),
  })
}

export async function RESTORE(id: string): Promise<NextResponse> {
  const profile = getStudentProfile(id)
  if (!profile) {
    return NextResponse.json(
      {
        status: 'error',
        data: null,
        message: 'Student profile not found',
        timestamp: new Date().toISOString(),
      },
      { status: 404 }
    )
  }

  const restored = restoreStudentProfile(id)

  return NextResponse.json({
    status: 'success',
    data: restored,
    message: 'Student profile restored',
    timestamp: new Date().toISOString(),
  })
}

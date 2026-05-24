import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import {
  getLearner,
  updateLearner,
  archiveLearner,
  restoreLearner,
  type LearnerRow,
} from '@/features/children/server/repository'
import { archiveSubjectsByLearner } from '@/features/subjects/server/repository'
import { guardOwnership } from '@/features/auth/server/routeOwnership'
import { notFoundResponse } from '@/features/auth/server/context'

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

export async function GET(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    const { householdId } = getRequestAuthCtx()
    const row = await getLearner(id, householdId)
    if (!row) return notFoundResponse('Student profile not found')
    return NextResponse.json({ status: 'success', data: learnerRowToStudentProfile(row), message: 'Student profile retrieved', timestamp: new Date().toISOString() })
  })
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  return guardOwnership(async () => {
    const body = await request.json()
    const { householdId } = getRequestAuthCtx()
    const updated = await updateLearner(id, householdId, {
      name: body.name !== undefined ? body.name.trim() : undefined,
      gradeLevel: body.gradeLabel !== undefined ? body.gradeLabel.trim() : undefined,
    })
    if (!updated) return notFoundResponse('Student profile not found')
    return NextResponse.json({ status: 'success', data: learnerRowToStudentProfile(updated), message: 'Student profile updated', timestamp: new Date().toISOString() })
  })
}

export async function ARCHIVE(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    const { householdId } = getRequestAuthCtx()
    const archived = await archiveLearner(id, householdId)
    if (!archived) return notFoundResponse('Student profile not found')
    await archiveSubjectsByLearner(id, householdId)
    return NextResponse.json({ status: 'success', data: learnerRowToStudentProfile(archived), message: 'Student profile archived', timestamp: new Date().toISOString() })
  })
}

export async function RESTORE(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    const { householdId } = getRequestAuthCtx()
    const restored = await restoreLearner(id, householdId)
    if (!restored) return notFoundResponse('Student profile not found')
    return NextResponse.json({ status: 'success', data: learnerRowToStudentProfile(restored), message: 'Student profile restored', timestamp: new Date().toISOString() })
  })
}

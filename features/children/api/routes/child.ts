import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import {
  getStudentProfile,
  updateStudentProfile,
  archiveStudentProfile,
  restoreStudentProfile,
} from '@/features/children/server/service'
import {
  getLearner,
  updateLearner,
  archiveLearner,
  restoreLearner,
  type LearnerRow,
} from '@/features/children/server/repository'
import { archiveByChildId as archiveSubjectsByChildId } from '@/features/subjects/server/service'
import { archiveByChildId as archiveAttendanceByChildId } from '@/features/attendance/server/service'
import { archiveByChildId as archivePlannerByChildId } from '@/features/plan/server/service'
import { archiveByChildId as archivePortfolioByChildId } from '@/features/portfolio/server/service'
import { isPostgresMode } from '@/features/lib/server/db'
import { guardOwnership, assertSessionOwnership, sessionAuthCtx } from '@/features/auth/server/routeOwnership'
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
    if (isPostgresMode()) {
      const { householdId } = await sessionAuthCtx()
      const row = await getLearner(id, householdId)
      if (!row) return notFoundResponse('Student profile not found')
      return NextResponse.json({
        status: 'success',
        data: learnerRowToStudentProfile(row),
        message: 'Student profile retrieved',
        timestamp: new Date().toISOString(),
      })
    }

    await assertSessionOwnership('learner', id)
    const profile = getStudentProfile(id)
    if (!profile) return notFoundResponse('Student profile not found')

    return NextResponse.json({
      status: 'success',
      data: profile,
      message: 'Student profile retrieved',
      timestamp: new Date().toISOString(),
    })
  })
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  return guardOwnership(async () => {
    const body = await request.json()

    if (isPostgresMode()) {
      const { householdId } = await sessionAuthCtx()
      const updated = await updateLearner(id, householdId, {
        name: body.name !== undefined ? body.name.trim() : undefined,
        gradeLevel: body.gradeLabel !== undefined ? body.gradeLabel.trim() : undefined,
      })
      if (!updated) return notFoundResponse('Student profile not found')
      return NextResponse.json({
        status: 'success',
        data: learnerRowToStudentProfile(updated),
        message: 'Student profile updated',
        timestamp: new Date().toISOString(),
      })
    }

    await assertSessionOwnership('learner', id)
    const profile = getStudentProfile(id)
    if (!profile) return notFoundResponse('Student profile not found')

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
  })
}

export async function ARCHIVE(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    if (isPostgresMode()) {
      const { householdId } = await sessionAuthCtx()
      const archived = await archiveLearner(id, householdId)
      if (!archived) return notFoundResponse('Student profile not found')
      return NextResponse.json({
        status: 'success',
        data: learnerRowToStudentProfile(archived),
        message: 'Student profile archived',
        timestamp: new Date().toISOString(),
      })
    }

    await assertSessionOwnership('learner', id)
    const profile = getStudentProfile(id)
    if (!profile) return notFoundResponse('Student profile not found')

    const archived = archiveStudentProfile(id)
    archiveSubjectsByChildId(id)
    archiveAttendanceByChildId(id)
    archivePlannerByChildId(id)
    archivePortfolioByChildId(id)

    return NextResponse.json({
      status: 'success',
      data: archived,
      message: 'Student profile archived',
      timestamp: new Date().toISOString(),
    })
  })
}

export async function RESTORE(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    if (isPostgresMode()) {
      const { householdId } = await sessionAuthCtx()
      const restored = await restoreLearner(id, householdId)
      if (!restored) return notFoundResponse('Student profile not found')
      return NextResponse.json({
        status: 'success',
        data: learnerRowToStudentProfile(restored),
        message: 'Student profile restored',
        timestamp: new Date().toISOString(),
      })
    }

    await assertSessionOwnership('learner', id)
    const profile = getStudentProfile(id)
    if (!profile) return notFoundResponse('Student profile not found')

    const restored = restoreStudentProfile(id)
    return NextResponse.json({
      status: 'success',
      data: restored,
      message: 'Student profile restored',
      timestamp: new Date().toISOString(),
    })
  })
}

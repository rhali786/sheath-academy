import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import {
  getLearner,
  updateLearner,
  archiveLearner,
  restoreLearner,
  type LearnerRow,
  type UpdateLearnerInput,
} from '@/features/children/server/repository'
import { archiveSubjectsByLearner } from '@/features/subjects/server/repository'
import { guardOwnership } from '@/features/auth/server/routeOwnership'
import { notFoundResponse } from '@/features/auth/server/context'
import { getUserById, getMembership, deactivateMember } from '@/features/household/server/repository'
import { deactivateUserCredentials, deleteUser } from '@/features/auth/server/repository'
import { provisionLearnerLogin } from '@/features/children/server/learnerLogin'
import { logger } from '@/features/lib/logger'

async function learnerRowToStudentProfile(row: LearnerRow): Promise<StudentProfile> {
  let username = ''
  let learnerLoginEnabled = false
  if (row.userId) {
    const [user, membership] = await Promise.all([
      getUserById(row.userId),
      getMembership(row.householdId, row.userId),
    ])
    username = user?.username ?? ''
    learnerLoginEnabled = !!user?.passwordHash && !!membership?.isActive
  }
  return {
    id: row.id,
    householdId: row.householdId,
    name: row.name,
    firstName: row.firstName ?? undefined,
    lastName: row.lastName ?? undefined,
    dob: row.dob ?? undefined,
    gradeLabel: row.gradeLevel ?? '',
    username,
    password: '',
    isActive: row.isActive,
    learnerLoginEnabled,
    avatarInitials: row.name.charAt(0).toUpperCase(),
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    const { householdId } = getRequestAuthCtx()
    const row = await getLearner(id, householdId)
    if (!row) return notFoundResponse('Student profile not found')
    return NextResponse.json({ status: 'success', data: await learnerRowToStudentProfile(row), message: 'Student profile retrieved', timestamp: new Date().toISOString() })
  })
}

export async function PUT(id: string, request: Request): Promise<NextResponse> {
  return guardOwnership(async () => {
    const body = await request.json()
    const { householdId } = getRequestAuthCtx()

    const existing = await getLearner(id, householdId)
    if (!existing) return notFoundResponse('Student profile not found')

    const { name, firstName, lastName, gradeLabel, dob, learnerLoginEnabled, username, password } = body as {
      name?: string
      firstName?: string
      lastName?: string
      gradeLabel?: string
      dob?: string
      learnerLoginEnabled?: boolean
      username?: string
      password?: string
    }

    const patch: UpdateLearnerInput = {}
    if (name !== undefined) patch.name = name.trim()
    if (firstName !== undefined) patch.firstName = firstName.trim()
    if (lastName !== undefined) patch.lastName = lastName.trim()
    if (gradeLabel !== undefined) patch.gradeLevel = gradeLabel.trim()
    if (dob !== undefined) patch.dob = dob ? dob : null

    // Tracks a credential user created by *this* request, so a later failure can
    // undo it rather than leaving its username orphaned (feedback item 5).
    let createdUserId: string | null = null

    if (learnerLoginEnabled === true) {
      const trimmedUsername = username?.trim()
      if (!trimmedUsername) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'username is required to enable learner login', timestamp: new Date().toISOString() },
          { status: 400 },
        )
      }

      let provisioned
      try {
        provisioned = await provisionLearnerLogin({
          householdId,
          learnerId: existing.id,
          learnerName: patch.name ?? existing.name,
          username: trimmedUsername,
          password,
          existingUserId: existing.userId ?? null,
        })
      } catch (err) {
        logger.error({ householdId, learnerId: existing.id, err }, 'PUT child: failed to provision learner login')
        return NextResponse.json(
          { status: 'error', data: null, message: 'Could not enable learner login. Please try again.', timestamp: new Date().toISOString() },
          { status: 500 },
        )
      }

      if (!provisioned.ok) {
        return NextResponse.json(
          { status: 'error', data: null, message: provisioned.message, timestamp: new Date().toISOString() },
          { status: provisioned.status },
        )
      }

      createdUserId = provisioned.createdUserId
      patch.userId = provisioned.userId
    } else if (learnerLoginEnabled === false) {
      if (existing.userId) {
        await deactivateUserCredentials(existing.userId)
        await deactivateMember(householdId, existing.userId)
      }
    }

    let updated
    try {
      updated = await updateLearner(id, householdId, patch)
    } catch (err) {
      if (createdUserId) await deleteUser(createdUserId)
      logger.error({ householdId, learnerId: id, err }, 'PUT child: link write failed — rolled back new credential user')
      return NextResponse.json(
        { status: 'error', data: null, message: 'Could not save changes. Please try again.', timestamp: new Date().toISOString() },
        { status: 500 },
      )
    }

    if (!updated) {
      // The credential user exists but nothing links to it — remove it so the
      // username is not permanently claimed by an unreachable row.
      if (createdUserId) await deleteUser(createdUserId)
      return notFoundResponse('Student profile not found')
    }

    return NextResponse.json({ status: 'success', data: await learnerRowToStudentProfile(updated), message: 'Student profile updated', timestamp: new Date().toISOString() })
  })
}

export async function ARCHIVE(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    const { householdId } = getRequestAuthCtx()
    const archived = await archiveLearner(id, householdId)
    if (!archived) return notFoundResponse('Student profile not found')
    await archiveSubjectsByLearner(id, householdId)
    return NextResponse.json({ status: 'success', data: await learnerRowToStudentProfile(archived), message: 'Student profile archived', timestamp: new Date().toISOString() })
  })
}

export async function RESTORE(id: string): Promise<NextResponse> {
  return guardOwnership(async () => {
    const { householdId } = getRequestAuthCtx()
    const restored = await restoreLearner(id, householdId)
    if (!restored) return notFoundResponse('Student profile not found')
    return NextResponse.json({ status: 'success', data: await learnerRowToStudentProfile(restored), message: 'Student profile restored', timestamp: new Date().toISOString() })
  })
}

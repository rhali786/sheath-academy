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
import { getUserById, getMembership, addMember, deactivateMember, reactivateMember } from '@/features/household/server/repository'
import {
  createLearnerCredentialUser,
  updateUserUsername,
  updateUserPassword,
  deactivateUserCredentials,
  getUserByIdentifier,
} from '@/features/auth/server/repository'
import { hashPassword } from '@/features/auth/server/password'

/** Synthesized email for username-only learner logins — users.email is NOT NULL
 *  UNIQUE and these learners have no real email. Keyed by learner id for stability
 *  and collision-safety (a learner id is unique per household by construction). */
function placeholderLearnerEmail(learnerId: string): string {
  return `learner.${learnerId}@no-email.local`
}

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

    if (learnerLoginEnabled === true) {
      const trimmedUsername = username?.trim()
      if (!trimmedUsername) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'username is required to enable learner login', timestamp: new Date().toISOString() },
          { status: 400 },
        )
      }

      const currentUser = existing.userId ? await getUserById(existing.userId) : null
      const needsPassword = !currentUser || !currentUser.passwordHash
      if (needsPassword && !password?.trim()) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'password is required to enable learner login', timestamp: new Date().toISOString() },
          { status: 400 },
        )
      }

      const dup = await getUserByIdentifier(trimmedUsername)
      if (dup && dup.id !== existing.userId) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'Username is already taken', timestamp: new Date().toISOString() },
          { status: 409 },
        )
      }

      if (!existing.userId) {
        const passwordHash = await hashPassword(password!.trim())
        const credUser = await createLearnerCredentialUser({
          name: patch.name ?? existing.name,
          email: placeholderLearnerEmail(existing.id),
          username: trimmedUsername,
          passwordHash,
        })
        await addMember(householdId, credUser.id, 'learner')
        patch.userId = credUser.id
      } else {
        await updateUserUsername(existing.userId, trimmedUsername)
        if (password?.trim()) {
          const passwordHash = await hashPassword(password.trim())
          await updateUserPassword(existing.userId, passwordHash)
        }
        await reactivateMember(householdId, existing.userId)
      }
    } else if (learnerLoginEnabled === false) {
      if (existing.userId) {
        await deactivateUserCredentials(existing.userId)
        await deactivateMember(householdId, existing.userId)
      }
    }

    const updated = await updateLearner(id, householdId, patch)
    if (!updated) return notFoundResponse('Student profile not found')
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

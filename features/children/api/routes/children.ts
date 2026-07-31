import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, StudentProfile } from '@/features/lib/types'
import { listLearners, listAllLearners, createLearner } from '@/features/children/server/repository'
import type { LearnerRow } from '@/features/children/server/repository'
import { getUserById, getMembership, addMember } from '@/features/household/server/repository'
import { createLearnerCredentialUser, getUserByIdentifier } from '@/features/auth/server/repository'
import { hashPassword } from '@/features/auth/server/password'

/** Synthesized email for username-only learner logins — see child.ts for rationale. */
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

export async function GET(request: Request): Promise<NextResponse<ApiResponse<StudentProfile[]>>> {
  const url = new URL(request.url)
  const includeArchived = url.searchParams.get('includeArchived') === 'true'

  try {
    const { householdId } = getRequestAuthCtx()
    const rows = includeArchived ? await listAllLearners(householdId) : await listLearners(householdId)
    const profiles = await Promise.all(rows.map(learnerRowToStudentProfile))
    return NextResponse.json({ status: 'success', data: profiles, message: 'Student profiles retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Student profiles retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = await request.json()

  try {
    const { householdId, userId } = getRequestAuthCtx()
    const { name, gradeLabel, firstName, lastName, dob, learnerLoginEnabled, username, password } = body as {
      name?: string
      gradeLabel?: string
      firstName?: string
      lastName?: string
      dob?: string
      learnerLoginEnabled?: boolean
      username?: string
      password?: string
    }
    if (!name?.trim()) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'name is required', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    const trimmedUsername = username?.trim()
    if (learnerLoginEnabled) {
      if (!trimmedUsername || !password?.trim()) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'username and password are required to enable learner login', timestamp: new Date().toISOString() },
          { status: 400 },
        )
      }
      const dup = await getUserByIdentifier(trimmedUsername)
      if (dup) {
        return NextResponse.json(
          { status: 'error', data: null, message: 'Username is already taken', timestamp: new Date().toISOString() },
          { status: 409 },
        )
      }
    }

    let row = await createLearner(householdId, {
      name: name.trim(),
      firstName: firstName?.trim(),
      lastName: lastName?.trim(),
      dob: dob || undefined,
      gradeLevel: gradeLabel?.trim(),
    })

    if (learnerLoginEnabled && trimmedUsername && password) {
      const passwordHash = await hashPassword(password.trim())
      const credUser = await createLearnerCredentialUser({
        name: name.trim(),
        email: placeholderLearnerEmail(row.id),
        username: trimmedUsername,
        passwordHash,
      })
      await addMember(householdId, credUser.id, 'learner')
      const { updateLearner } = await import('@/features/children/server/repository')
      row = (await updateLearner(row.id, householdId, { userId: credUser.id })) ?? row
    }

    const { trackLearnerCreated } = await import('@/features/admin-metrics/server/instrument')
    void trackLearnerCreated(userId, householdId, row.id)
    return NextResponse.json(
      { status: 'success', data: await learnerRowToStudentProfile(row), message: 'Student profile created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to create student profile', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isAppAdmin } from '@/features/lib/server/appAdmin'
import { NotFoundError, isNotFoundError } from './errors'
import { logger } from '@/features/lib/logger'

export interface AuthCtx {
  userId: string
  householdId: string
  email?: string
  timezone?: string
}

export type OwnershipEntityType =
  | 'learner'
  | 'lesson'
  | 'attendance'
  | 'session'
  | 'evidence'
  | 'alert'

export function unauthorizedResponse(): Response {
  return NextResponse.json(
    {
      status: 'error',
      data: null,
      message: 'Unauthorized',
      timestamp: new Date().toISOString(),
    },
    { status: 401 },
  )
}

export function setupRequiredResponse(): Response {
  return NextResponse.json(
    {
      status: 'error',
      data: null,
      message: 'Household setup required',
      code: 'setup_required',
      timestamp: new Date().toISOString(),
    },
    { status: 403 },
  )
}

/** Returns true when the auth context belongs to an app admin (ADMIN_EMAIL). */
export function assertAppAdmin(ctx: AuthCtx): boolean {
  return isAppAdmin(ctx.email)
}

export function notFoundResponse(message = 'Not found'): NextResponse {
  return NextResponse.json(
    {
      status: 'error',
      data: null,
      message,
      timestamp: new Date().toISOString(),
    },
    { status: 404 },
  )
}

/** Wraps a route handler to map NotFoundError → 404 JSON. */
export async function withOwnershipGuard(
  fn: () => Promise<Response>,
): Promise<Response> {
  try {
    return await fn()
  } catch (e) {
    if (isNotFoundError(e)) return notFoundResponse()
    throw e
  }
}

/**
 * Resolves auth context from JWT session claims (no DB round-trip).
 * Returns null when there is no authenticated session or tenant claims are missing.
 */
export async function getAuthCtx(_request?: NextRequest): Promise<AuthCtx | null> {
  const { tryGetRequestAuthCtx } = await import('@/features/auth/server/requestAuth')
  const requestCtx = tryGetRequestAuthCtx()
  if (requestCtx) return requestCtx

  const { auth } = await import('@/features/auth/auth')
  const session = await auth()
  const user = session?.user
  if (!user?.email) return null

  const userId = user.userId
  const householdId = user.householdId
  if (!userId || !householdId) return null

  return {
    userId,
    householdId,
    email: user.email,
    timezone: user.timezone,
  }
}

/**
 * Returns AuthCtx or a 401/403 Response for route handlers.
 */
export async function requireAuthCtx(request: NextRequest): Promise<AuthCtx | Response> {
  const { tryGetRequestAuthCtx } = await import('@/features/auth/server/requestAuth')
  const requestCtx = tryGetRequestAuthCtx()
  if (requestCtx) {
    if (!requestCtx.householdId) {
      logger.warn({ userId: requestCtx.userId }, 'requireAuthCtx: householdId missing on request ctx — 403')
      return setupRequiredResponse()
    }
    return requestCtx
  }

  const { auth } = await import('@/features/auth/auth')
  const session = await auth()
  if (!session?.user?.email) {
    logger.warn('requireAuthCtx: no session email — 401')
    return unauthorizedResponse()
  }

  const userId = session.user.userId
  const householdId = session.user.householdId
  if (!userId || !householdId) {
    logger.warn({ email: session.user.email, userId, householdId }, 'requireAuthCtx: missing userId or householdId — 403')
    return setupRequiredResponse()
  }

  return {
    userId,
    householdId,
    email: session.user.email,
    timezone: session.user.timezone,
  }
}

/**
 * Validates that an entity belongs to the session household.
 * Throws NotFoundError when missing or owned by another household.
 */
export async function assertOwnership(
  authCtx: AuthCtx,
  entityType: OwnershipEntityType,
  entityId: string,
): Promise<void> {
  if (!entityId?.trim()) {
    throw new NotFoundError()
  }
  await assertPostgresOwnership(authCtx, entityType, entityId)
}

async function assertPostgresOwnership(
  authCtx: AuthCtx,
  entityType: OwnershipEntityType,
  entityId: string,
): Promise<void> {
  const { householdId } = authCtx

  switch (entityType) {
    case 'learner': {
      const { getLearner } = await import('@/features/children/server/repository')
      const row = await getLearner(entityId, householdId)
      if (!row) throw new NotFoundError()
      return
    }
    case 'lesson': {
      const { getLessonTaskRow } = await import('@/features/plan/server/repository')
      const row = await getLessonTaskRow(entityId, householdId)
      if (!row) throw new NotFoundError()
      return
    }
    case 'attendance': {
      const { getAttendanceEvent } = await import('@/features/attendance/server/repository')
      const row = await getAttendanceEvent(entityId, householdId)
      if (!row) throw new NotFoundError()
      return
    }
    case 'session': {
      const { getQuranSessionRow } = await import('@/features/quran/server/repository')
      const row = await getQuranSessionRow(entityId, householdId)
      if (!row) throw new NotFoundError()
      return
    }
    case 'evidence': {
      const { getEvidenceRow } = await import('@/features/portfolio/server/repository')
      const row = await getEvidenceRow(entityId, householdId)
      if (!row) throw new NotFoundError()
      return
    }
    case 'alert':
      throw new NotFoundError()
    default:
      throw new NotFoundError()
  }
}


/** For tests: user with household but no row yet (setup_required path). */
export async function getAuthCtxWithoutHousehold(): Promise<AuthCtx | null> {
  const { auth } = await import('@/features/auth/auth')
  const session = await auth()
  if (!session?.user?.id) return null

  const { getHouseholdForUser } = await import('@/features/household/server/repository')
  const household = await getHouseholdForUser(session.user.id)
  return { userId: session.user.id, householdId: household?.id ?? '' }
}

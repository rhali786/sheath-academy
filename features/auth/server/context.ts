import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { resolveTenant } from '@/features/lib/server/tenant'
import { NotFoundError, isNotFoundError } from './errors'

export interface AuthCtx {
  userId: string
  householdId: string
  /** Present when resolved from Postgres tenant context. */
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
 * Resolves auth context from the current session.
 * Returns null when there is no authenticated session.
 */
export async function getAuthCtx(_request?: NextRequest): Promise<AuthCtx | null> {
  const { auth } = await import('@/features/auth/auth')
  const session = await auth()
  if (!session?.user?.email && !session?.user?.id) {
    return null
  }

  try {
    const tenant = await resolveTenant(session)
    return { userId: tenant.userId, householdId: tenant.householdId, timezone: tenant.timezone }
  } catch {
    return null
  }
}

/**
 * Returns AuthCtx or a 401/403 Response for route handlers.
 */
export async function requireAuthCtx(request: NextRequest): Promise<AuthCtx | Response> {
  const ctx = await getAuthCtx(request)
  if (!ctx) return unauthorizedResponse()
  if (!ctx.householdId) return setupRequiredResponse()
  return ctx
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

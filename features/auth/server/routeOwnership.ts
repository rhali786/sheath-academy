import { NextResponse } from 'next/server'
import {
  assertOwnership,
  getAuthCtx,
  withOwnershipGuard,
  type AuthCtx,
  type OwnershipEntityType,
} from './context'
import { getRequestAuthCtx, tryGetRequestAuthCtx } from './requestAuth'

/** Session household for route handlers (after API choke-point auth). */
export async function sessionAuthCtx(): Promise<AuthCtx> {
  const requestCtx = tryGetRequestAuthCtx()
  if (requestCtx) return requestCtx

  const ctx = await getAuthCtx()
  if (!ctx) {
    throw new Error('Unauthenticated — no session email')
  }
  return ctx
}

/** Sync access when handler is known to run inside API dispatch. */
export function requireRequestAuthCtx(): AuthCtx {
  return getRequestAuthCtx()
}

/** Ensures an entity belongs to the signed-in household; throws NotFoundError otherwise. */
export async function assertSessionOwnership(
  entityType: OwnershipEntityType,
  entityId: string,
): Promise<void> {
  const ctx = await sessionAuthCtx()
  await assertOwnership(ctx, entityType, entityId)
}

/** Maps NotFoundError from ownership checks to 404 JSON. */
export function guardOwnership(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return withOwnershipGuard(fn) as Promise<NextResponse>
}

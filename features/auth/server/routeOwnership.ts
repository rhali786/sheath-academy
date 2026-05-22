import { NextResponse } from 'next/server'
import { getHouseholdContext } from '@/features/lib/server/tenant'
import {
  assertOwnership,
  withOwnershipGuard,
  type AuthCtx,
  type OwnershipEntityType,
} from './context'

/** Session household for route handlers (after API choke-point auth). */
export async function sessionAuthCtx(): Promise<AuthCtx> {
  const tenant = await getHouseholdContext()
  return {
    userId: tenant.userId,
    householdId: tenant.householdId,
    timezone: tenant.timezone,
  }
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

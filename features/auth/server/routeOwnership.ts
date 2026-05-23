import { NextResponse } from 'next/server'
import {
  assertOwnership,
  withOwnershipGuard,
  type OwnershipEntityType,
} from './context'
import { getRequestAuthCtx } from './requestAuth'

/** Ensures an entity belongs to the signed-in household; throws NotFoundError otherwise. */
export async function assertSessionOwnership(
  entityType: OwnershipEntityType,
  entityId: string,
): Promise<void> {
  await assertOwnership(getRequestAuthCtx(), entityType, entityId)
}

/** Maps NotFoundError from ownership checks to 404 JSON. */
export function guardOwnership(fn: () => Promise<NextResponse>): Promise<NextResponse> {
  return withOwnershipGuard(fn) as Promise<NextResponse>
}

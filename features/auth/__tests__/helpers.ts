import { SEED_IDS } from '@/features/lib/seedIds'
import type { AuthCtx } from '@/features/auth/server/context'

/** Default auth context for memory-mode API tests (seed household). */
export const SEED_AUTH_CTX: AuthCtx = {
  userId: 'test-user',
  householdId: SEED_IDS.household,
}

export function seedAuthCtx(overrides?: Partial<AuthCtx>): AuthCtx {
  return { ...SEED_AUTH_CTX, ...overrides }
}

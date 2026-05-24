import { SEED_IDS } from '@/features/lib/seedIds'
import type { AuthCtx } from '@/features/auth/server/context'

/** Default auth context for memory-mode API tests (seed household). */
export const SEED_AUTH_CTX: AuthCtx = {
  userId: 'test-user',
  householdId: SEED_IDS.household,
  email: 'parent@example.com',
}

export function seedAuthCtx(overrides?: Partial<AuthCtx>): AuthCtx {
  return { ...SEED_AUTH_CTX, ...overrides }
}

/** Default request-scoped auth for API route handler tests. */
export const SEED_REQUEST_AUTH_CTX: AuthCtx = {
  ...SEED_AUTH_CTX,
  timezone: 'UTC',
}

/** Jest mock factory for `@/features/auth/server/requestAuth`. */
export function mockRequestAuthModule(overrides?: Partial<AuthCtx>) {
  const ctx = { ...SEED_REQUEST_AUTH_CTX, ...overrides }
  return {
    getRequestAuthCtx: jest.fn(() => ctx),
    tryGetRequestAuthCtx: jest.fn(() => ctx),
    runWithAuthCtx: jest.fn((_authCtx: unknown, fn: () => unknown) => fn()),
  }
}

import { upsertUserByEmail, upsertHouseholdForUser } from '@/features/household/server/repository'

export interface TenantContext {
  userId: string
  householdId: string
  timezone: string
}

/** Dev/test only — returns a deterministic context driven by env vars. */
export function devTenantContext(): TenantContext {
  return {
    userId: process.env.DEV_SEED_USER_EMAIL ?? 'dev@sheath.local',
    householdId: 'dev-household-001',
    timezone: 'America/New_York',
  }
}

/**
 * Resolves tenant context from a NextAuth session.
 * Upserts the user and their one household in Postgres (idempotent).
 * Throws for unauthenticated or missing session email.
 */
export async function resolveTenant(
  session: { user?: { id?: string | null; email?: string | null; name?: string | null } | null } | null,
): Promise<TenantContext> {
  if (!session?.user?.email) {
    throw new Error('Unauthenticated — no session email')
  }

  const user = await upsertUserByEmail(session.user.email, session.user.name ?? undefined)
  const household = await upsertHouseholdForUser(user.id)

  return {
    userId: user.id,
    householdId: household.id,
    timezone: household.timezone ?? 'America/New_York',
  }
}

/**
 * Convenience helper for API route handlers.
 * Calls NextAuth's `auth()` and resolves the TenantContext.
 * Throws for unauthenticated requests.
 */
export async function getHouseholdContext(): Promise<TenantContext> {
  // Dynamic import keeps auth.ts out of the module graph in test environments.
  const { auth } = await import('@/features/auth/auth')
  const session = await auth()
  return resolveTenant(session)
}

import { upsertUserByEmail, upsertHouseholdForUser } from '@/features/household/server/repository'
import { getDevSeedUserEmail } from '@/features/lib/server/devUserEmail'

export interface TenantContext {
  userId: string
  householdId: string
  timezone: string
}

/** Dev/test only — returns a deterministic context driven by env vars. */
export function devTenantContext(): TenantContext {
  return {
    userId: getDevSeedUserEmail(),
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

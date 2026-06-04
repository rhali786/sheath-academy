import {
  upsertUserByEmail,
  upsertHouseholdForUser,
  listHouseholdsForUser,
  getPendingInvitationsForEmail,
  addMember,
} from '@/features/household/server/repository'
import { getUserSetting } from '@/features/settings/server/repository'
import { getDevSeedUserEmail } from '@/features/lib/server/devUserEmail'
import { logger } from '@/features/lib/logger'
import type { SessionMembership } from '@/types/next-auth'

export interface TenantContext {
  userId: string
  householdId: string
  timezone: string
  memberships: SessionMembership[]
  name?: string
}

/** Dev/test only — returns a deterministic context driven by env vars. */
export function devTenantContext(): TenantContext {
  return {
    userId: getDevSeedUserEmail(),
    householdId: 'dev-household-001',
    timezone: 'America/New_York',
    memberships: [{ householdId: 'dev-household-001', householdName: 'Dev Household', role: 'owner' }],
  }
}

/**
 * Resolves tenant context from a NextAuth session.
 * - Accepts any pending invitations for this email.
 * - Resolves or creates the user's household memberships.
 * - Picks the active household (from user_settings or the first membership).
 * - Upserts user and their first household if none exists (idempotent for new users).
 */
export async function resolveTenant(
  session: { user?: { id?: string | null; email?: string | null; name?: string | null } | null } | null,
): Promise<TenantContext> {
  if (!session?.user?.email) {
    throw new Error('Unauthenticated — no session email')
  }

  const { email, name } = session.user
  logger.debug({ email }, 'resolveTenant: upsert user')
  const user = await upsertUserByEmail(email, name ?? undefined)

  // Accept any pending invitations for this email before listing memberships
  const pendingInvites = await getPendingInvitationsForEmail(email)
  if (pendingInvites.length > 0) {
    logger.info({ email, count: pendingInvites.length }, 'resolveTenant: accepting pending invitations')
    for (const invite of pendingInvites) {
      await addMember(invite.householdId, user.id, invite.role as 'owner' | 'member')
    }
  }

  let memberships = await listHouseholdsForUser(user.id)

  // Brand-new user with no memberships → create their own household
  if (memberships.length === 0) {
    logger.info({ email, userId: user.id }, 'resolveTenant: new user — creating household')
    const hh = await upsertHouseholdForUser(user.id)
    memberships = [{ householdId: hh.id, householdName: hh.name, timezone: hh.timezone, role: 'owner', userId: user.id }]
  }

  // Choose active household: prefer the persisted preference, fall back to first
  const savedActiveId = await getUserSetting(user.id, 'active_household_id')
  const activeMembership =
    (typeof savedActiveId === 'string' && memberships.find(m => m.householdId === savedActiveId)) ||
    memberships[0]

  logger.debug({ email, userId: user.id, householdId: activeMembership.householdId }, 'resolveTenant: complete')

  const sessionMemberships: SessionMembership[] = memberships.map(m => ({
    householdId: m.householdId,
    householdName: m.householdName,
    role: m.role,
  }))

  return {
    userId: user.id,
    householdId: activeMembership.householdId,
    timezone: activeMembership.timezone ?? 'America/New_York',
    memberships: sessionMemberships,
    name: user.name ?? undefined,
  }
}

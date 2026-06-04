import { eq, and, inArray } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { users, households, householdMembers, householdInvitations } from '@/db/schema'

export type UserRow = typeof users.$inferSelect
export type HouseholdRow = typeof households.$inferSelect
export type HouseholdMemberRow = typeof householdMembers.$inferSelect
export type HouseholdInvitationRow = typeof householdInvitations.$inferSelect
export type MembershipRole = 'owner' | 'member'

export interface HouseholdMembership {
  householdId: string
  householdName: string
  timezone: string
  role: MembershipRole
  userId: string
}

/** Finds user by email or creates a new row. Idempotent. */
export async function upsertUserByEmail(
  email: string,
  name?: string,
  fixedId?: string,
): Promise<UserRow> {
  const db = getDb()
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) return existing[0]

  const now = new Date()
  const inserted = await db
    .insert(users)
    .values({
      id: fixedId ?? `user_${Date.now()}`,
      email,
      name: name ?? null,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

/** Finds or creates the household belonging to a user. Idempotent.
 *  Also ensures an owner membership row exists for the user. */
export async function upsertHouseholdForUser(
  userId: string,
  defaultName: string = 'My Household',
  fixedHouseholdId?: string,
): Promise<HouseholdRow> {
  const db = getDb()
  const existing = await db
    .select()
    .from(households)
    .where(eq(households.userId, userId))
    .limit(1)

  const household = existing.length > 0
    ? existing[0]
    : (await db
        .insert(households)
        .values({
          id: fixedHouseholdId ?? `household_${Date.now()}`,
          userId,
          name: defaultName,
          timezone: 'America/New_York',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning())[0]

  await addMember(household.id, userId, 'owner')
  return household
}

export async function getHouseholdForUser(userId: string): Promise<HouseholdRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(households)
    .where(eq(households.userId, userId))
    .limit(1)
  return result[0] ?? null
}

export async function getHouseholdById(householdId: string): Promise<HouseholdRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(households)
    .where(eq(households.id, householdId))
    .limit(1)
  return result[0] ?? null
}

export async function updateHouseholdName(
  householdId: string,
  name: string,
): Promise<HouseholdRow | null> {
  const db = getDb()
  const result = await db
    .update(households)
    .set({ name, updatedAt: new Date() })
    .where(eq(households.id, householdId))
    .returning()
  return result[0] ?? null
}

export async function updateHouseholdTimezone(
  householdId: string,
  timezone: string,
): Promise<HouseholdRow | null> {
  const db = getDb()
  const result = await db
    .update(households)
    .set({ timezone, updatedAt: new Date() })
    .where(eq(households.id, householdId))
    .returning()
  return result[0] ?? null
}

// ─── Membership functions ─────────────────────────────────────────────────────

/** Adds a user to a household with the given role. Idempotent — no-op if already a member. */
export async function addMember(
  householdId: string,
  userId: string,
  role: MembershipRole = 'member',
): Promise<HouseholdMemberRow> {
  const db = getDb()
  const existing = await db
    .select()
    .from(householdMembers)
    .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, userId)))
    .limit(1)
  if (existing.length > 0) return existing[0]

  const now = new Date()
  const inserted = await db
    .insert(householdMembers)
    .values({
      id: `hm_${householdId.slice(-8)}_${userId.slice(-8)}_${Date.now()}`,
      householdId,
      userId,
      role,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

/** Removes a user from a household. No-op if not a member. */
export async function removeMember(householdId: string, userId: string): Promise<void> {
  await getDb()
    .delete(householdMembers)
    .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, userId)))
}

/** Returns all membership rows for a household, including user identity. */
export async function listMembers(householdId: string): Promise<HouseholdMemberRow[]> {
  return getDb()
    .select()
    .from(householdMembers)
    .where(eq(householdMembers.householdId, householdId))
}

/** Returns all households a user is a member of, with household name and timezone. */
export async function listHouseholdsForUser(userId: string): Promise<HouseholdMembership[]> {
  const db = getDb()
  const rows = await db
    .select({
      householdId: households.id,
      householdName: households.name,
      timezone: households.timezone,
      role: householdMembers.role,
      userId: householdMembers.userId,
    })
    .from(householdMembers)
    .innerJoin(households, eq(householdMembers.householdId, households.id))
    .where(eq(householdMembers.userId, userId))

  return rows.map(r => ({
    ...r,
    role: r.role as MembershipRole,
  }))
}

/** Returns the membership row for a specific user+household pair, or null. */
export async function getMembership(
  householdId: string,
  userId: string,
): Promise<HouseholdMemberRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(householdMembers)
    .where(and(eq(householdMembers.householdId, householdId), eq(householdMembers.userId, userId)))
    .limit(1)
  return result[0] ?? null
}

/** Returns all pending (non-expired) invitations for a given email address. */
export async function getPendingInvitationsForEmail(
  email: string,
): Promise<HouseholdInvitationRow[]> {
  return getDb()
    .select()
    .from(householdInvitations)
    .where(
      and(
        eq(householdInvitations.email, email.toLowerCase()),
        eq(householdInvitations.status, 'pending'),
      ),
    )
}

/** Creates a new invitation row. */
export async function createInvitation(params: {
  householdId: string
  email: string
  role: MembershipRole
  tokenHash: string
  expiresAt: Date
  invitedByUserId: string
}): Promise<HouseholdInvitationRow> {
  const now = new Date()
  const inserted = await getDb()
    .insert(householdInvitations)
    .values({
      id: `inv_${Date.now()}_${params.householdId.slice(-6)}`,
      householdId: params.householdId,
      email: params.email.toLowerCase(),
      role: params.role,
      invitedByUserId: params.invitedByUserId,
      tokenHash: params.tokenHash,
      status: 'pending',
      expiresAt: params.expiresAt,
      createdAt: now,
    })
    .returning()
  return inserted[0]
}

/** Looks up an invitation by its hashed token. */
export async function getInvitationByTokenHash(
  tokenHash: string,
): Promise<HouseholdInvitationRow | null> {
  const result = await getDb()
    .select()
    .from(householdInvitations)
    .where(eq(householdInvitations.tokenHash, tokenHash))
    .limit(1)
  return result[0] ?? null
}

/** Looks up an invitation by its id. */
export async function getInvitationById(
  id: string,
): Promise<HouseholdInvitationRow | null> {
  const result = await getDb()
    .select()
    .from(householdInvitations)
    .where(eq(householdInvitations.id, id))
    .limit(1)
  return result[0] ?? null
}

/** Marks an invitation as accepted. */
export async function markInvitationAccepted(id: string): Promise<void> {
  await getDb()
    .update(householdInvitations)
    .set({ status: 'accepted', acceptedAt: new Date() })
    .where(eq(householdInvitations.id, id))
}

/** Marks an invitation as revoked. */
export async function markInvitationRevoked(id: string): Promise<void> {
  await getDb()
    .update(householdInvitations)
    .set({ status: 'revoked' })
    .where(eq(householdInvitations.id, id))
}

/** Returns all invitations for a household. */
export async function listInvitationsForHousehold(
  householdId: string,
): Promise<HouseholdInvitationRow[]> {
  return getDb()
    .select()
    .from(householdInvitations)
    .where(eq(householdInvitations.householdId, householdId))
}

export interface MemberWithUser {
  memberId: string
  userId: string
  role: MembershipRole
  email: string
  name: string | null
  createdAt: Date
}

/** Returns members of a household with their user identity fields. */
export async function listMembersWithUsers(householdId: string): Promise<MemberWithUser[]> {
  const rows = await getDb()
    .select({
      memberId: householdMembers.id,
      userId: householdMembers.userId,
      role: householdMembers.role,
      email: users.email,
      name: users.name,
      createdAt: householdMembers.createdAt,
    })
    .from(householdMembers)
    .innerJoin(users, eq(householdMembers.userId, users.id))
    .where(eq(householdMembers.householdId, householdId))

  return rows.map(r => ({ ...r, role: r.role as MembershipRole }))
}

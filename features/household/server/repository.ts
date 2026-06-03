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

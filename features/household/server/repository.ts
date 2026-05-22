import { eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { users, households } from '@/db/schema'

export type UserRow = typeof users.$inferSelect
export type HouseholdRow = typeof households.$inferSelect

/** Finds user by email or creates a new row. Idempotent. */
export async function upsertUserByEmail(email: string, name?: string): Promise<UserRow> {
  const db = getDb()
  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
  if (existing.length > 0) return existing[0]

  const now = new Date()
  const inserted = await db
    .insert(users)
    .values({
      id: `user_${Date.now()}`,
      email,
      name: name ?? null,
      role: 'user',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

/** Finds or creates the single household belonging to a user. Idempotent. */
export async function upsertHouseholdForUser(
  userId: string,
  defaultName: string = 'My Household',
): Promise<HouseholdRow> {
  const db = getDb()
  const existing = await db
    .select()
    .from(households)
    .where(eq(households.userId, userId))
    .limit(1)
  if (existing.length > 0) return existing[0]

  const now = new Date()
  const inserted = await db
    .insert(households)
    .values({
      id: `household_${Date.now()}`,
      userId,
      name: defaultName,
      timezone: 'America/New_York',
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
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

import { and, eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { householdSettings, userSettings } from '@/db/schema'

/** Returns the parsed JSON value for a household setting key, or undefined if not set. */
export async function getHouseholdSetting(
  householdId: string,
  key: string,
): Promise<unknown> {
  const db = getDb()
  const result = await db
    .select()
    .from(householdSettings)
    .where(and(eq(householdSettings.householdId, householdId), eq(householdSettings.key, key)))
    .limit(1)
  return result[0]?.value
}

/** Returns all settings for a household as a plain key-value object. */
export async function getAllHouseholdSettings(
  householdId: string,
): Promise<Record<string, unknown>> {
  const db = getDb()
  const rows = await db
    .select()
    .from(householdSettings)
    .where(eq(householdSettings.householdId, householdId))
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

/** Upserts a household setting. Value must be JSON-serialisable. */
export async function setHouseholdSetting(
  householdId: string,
  key: string,
  value: unknown,
): Promise<void> {
  const db = getDb()
  const now = new Date()
  const existing = await db
    .select()
    .from(householdSettings)
    .where(and(eq(householdSettings.householdId, householdId), eq(householdSettings.key, key)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(householdSettings)
      .set({ value, updatedAt: now })
      .where(and(eq(householdSettings.householdId, householdId), eq(householdSettings.key, key)))
  } else {
    await db.insert(householdSettings).values({
      id: `hs_${Date.now()}_${key}`,
      householdId,
      key,
      value,
      createdAt: now,
      updatedAt: now,
    })
  }
}

/** Returns the parsed JSON value for a user setting key, or undefined if not set. */
export async function getUserSetting(userId: string, key: string): Promise<unknown> {
  const db = getDb()
  const result = await db
    .select()
    .from(userSettings)
    .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)))
    .limit(1)
  return result[0]?.value
}

/** Upserts a user setting. Value must be JSON-serialisable. */
export async function setUserSetting(
  userId: string,
  key: string,
  value: unknown,
): Promise<void> {
  const db = getDb()
  const now = new Date()
  const existing = await db
    .select()
    .from(userSettings)
    .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)))
    .limit(1)

  if (existing.length > 0) {
    await db
      .update(userSettings)
      .set({ value, updatedAt: now })
      .where(and(eq(userSettings.userId, userId), eq(userSettings.key, key)))
  } else {
    await db.insert(userSettings).values({
      id: `us_${Date.now()}_${key}`,
      userId,
      key,
      value,
      createdAt: now,
      updatedAt: now,
    })
  }
}

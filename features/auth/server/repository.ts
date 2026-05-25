import { eq, or } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { users } from '@/db/schema'
import { normalizeEmail, normalizeUsername } from './password'
import { upsertHouseholdForUser } from '@/features/household/server/repository'

export type AuthUserRow = typeof users.$inferSelect

/** Look up by email or normalized username; returns null if not found. */
export async function getUserByIdentifier(identifier: string): Promise<AuthUserRow | null> {
  const trimmed = identifier.trim()
  const isEmail = trimmed.includes('@')
  const db = getDb()

  if (isEmail) {
    const rows = await db
      .select()
      .from(users)
      .where(eq(users.email, normalizeEmail(trimmed)))
      .limit(1)
    return rows[0] ?? null
  }

  const rows = await db
    .select()
    .from(users)
    .where(eq(users.usernameNormalized, normalizeUsername(trimmed)))
    .limit(1)
  return rows[0] ?? null
}

/** Look up user by email only. */
export async function getUserByEmail(email: string): Promise<AuthUserRow | null> {
  const rows = await getDb()
    .select()
    .from(users)
    .where(eq(users.email, normalizeEmail(email)))
    .limit(1)
  return rows[0] ?? null
}

interface CreateCredentialUserInput {
  name: string
  email: string
  username: string
  passwordHash: string
}

/** Creates a new credential user and their household. Throws on duplicate email or username. */
export async function createCredentialUser(data: CreateCredentialUserInput): Promise<AuthUserRow> {
  const db = getDb()
  const now = new Date()
  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`

  const inserted = await db
    .insert(users)
    .values({
      id,
      email: normalizeEmail(data.email),
      name: data.name.trim(),
      username: data.username.trim(),
      usernameNormalized: normalizeUsername(data.username),
      passwordHash: data.passwordHash,
      passwordUpdatedAt: now,
      createdVia: 'credentials',
      role: 'user',
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  await upsertHouseholdForUser(inserted[0].id)
  return inserted[0]
}

/** Updates a user's password hash and timestamp. */
export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ passwordHash, passwordUpdatedAt: new Date(), updatedAt: new Date() })
    .where(eq(users.id, userId))
}

/** Stamps lastLoginAt for the given email. No-op if the user doesn't exist yet. */
export async function updateUserLastLogin(email: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.email, email.trim().toLowerCase()))
}

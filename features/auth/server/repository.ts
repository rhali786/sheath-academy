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

interface CreateLearnerCredentialUserInput {
  name: string
  email: string
  username: string
  passwordHash: string
}

/**
 * Creates a credential user for a learner login, WITHOUT creating a household —
 * unlike createCredentialUser (adult signup), which always calls
 * upsertHouseholdForUser. Callers must separately call addMember(existingHouseholdId,
 * user.id, 'learner') to attach the new user to the household that already owns the
 * learner profile (mirrors features/household/api/routes/accept.ts). Throws on
 * duplicate email or username.
 */
export async function createLearnerCredentialUser(
  data: CreateLearnerCredentialUserInput,
): Promise<AuthUserRow> {
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
      createdVia: 'learner-login',
      role: 'user',
      createdAt: now,
      updatedAt: now,
    })
    .returning()

  return inserted[0]
}

/** Updates a user's username (and its normalized lookup value). */
export async function updateUserUsername(userId: string, username: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ username: username.trim(), usernameNormalized: normalizeUsername(username), updatedAt: new Date() })
    .where(eq(users.id, userId))
}

/**
 * Deactivates a credential user's ability to sign in by clearing their password
 * hash, without deleting the user row (preserves username/email history). Used
 * when a household disables "Allow learner to sign in" — see decision in
 * docs/20260716-feedback-batch-g1-g7-plan.json phase-g3-learner-profile-and-login.
 * The credentials authorize() callback (features/auth/auth.ts) already returns
 * null when passwordHash is falsy, so this is sufficient to block login without
 * touching auth.ts.
 */
export async function deactivateUserCredentials(userId: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ passwordHash: null, updatedAt: new Date() })
    .where(eq(users.id, userId))
}

/** Stamps lastLoginAt for the given email. No-op if the user doesn't exist yet. */
export async function updateUserLastLogin(email: string): Promise<void> {
  await getDb()
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.email, email.trim().toLowerCase()))
}

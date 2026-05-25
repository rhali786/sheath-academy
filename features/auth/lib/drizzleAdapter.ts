import type { Adapter, AdapterAccount, AdapterUser, VerificationToken } from '@auth/core/adapters'
import { and, eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { users, accounts, verificationTokens } from '@/db/schema'
import { upsertUserByEmail } from '@/features/household/server/repository'

function toAdapterUser(row: typeof users.$inferSelect): AdapterUser {
  return {
    id: row.id,
    email: row.email,
    name: row.name ?? null,
    emailVerified: row.emailVerified ?? null,
    image: row.image ?? null,
  }
}

/**
 * Postgres-backed NextAuth adapter. Reuses the app `users` table and
 * `upsertUserByEmail` so auth identities align with household tenant rows.
 */
export const drizzleAdapter: Adapter = {
  async createUser(data) {
    const email = data.email
    if (!email) {
      throw new Error('createUser requires email')
    }

    const db = getDb()
    const existing = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (existing.length > 0) {
      return toAdapterUser(existing[0])
    }

    const user = await upsertUserByEmail(email, data.name ?? undefined)
    if (data.emailVerified || data.image) {
      const updated = await db
        .update(users)
        .set({
          emailVerified: data.emailVerified ?? null,
          image: data.image ?? null,
          updatedAt: new Date(),
        })
        .where(eq(users.id, user.id))
        .returning()
      return toAdapterUser(updated[0])
    }

    return toAdapterUser(user)
  },

  async getUser(id) {
    const row = await getDb().select().from(users).where(eq(users.id, id)).limit(1)
    return row[0] ? toAdapterUser(row[0]) : null
  },

  async getUserByEmail(email) {
    const db = getDb()
    const row = await db.select().from(users).where(eq(users.email, email)).limit(1)
    if (!row[0]) return null

    // If the user exists but has no linked auth accounts and no password hash,
    // they're in an orphaned state (e.g. a prior OAuth attempt created the user row
    // but linkAccount never ran). Return null so NextAuth falls through to
    // createUser → linkAccount instead of throwing OAuthAccountNotLinked.
    if (!row[0].passwordHash) {
      const linked = await db.select().from(accounts).where(eq(accounts.userId, row[0].id)).limit(1)
      if (linked.length === 0) return null
    }

    return toAdapterUser(row[0])
  },

  async updateUser(data) {
    if (!data.id) {
      throw new Error('No user id.')
    }

    const patch: Partial<typeof users.$inferInsert> = { updatedAt: new Date() }
    if (data.name !== undefined) patch.name = data.name
    if (data.email !== undefined) patch.email = data.email
    if (data.emailVerified !== undefined) patch.emailVerified = data.emailVerified
    if (data.image !== undefined) patch.image = data.image

    const updated = await getDb()
      .update(users)
      .set(patch)
      .where(eq(users.id, data.id))
      .returning()

    if (!updated[0]) {
      throw new Error(`User ${data.id} not found`)
    }

    return toAdapterUser(updated[0])
  },

  async getUserByAccount({ provider, providerAccountId }) {
    const db = getDb()
    const result = await db
      .select({ user: users })
      .from(accounts)
      .innerJoin(users, eq(accounts.userId, users.id))
      .where(
        and(
          eq(accounts.provider, provider),
          eq(accounts.providerAccountId, providerAccountId),
        ),
      )
      .limit(1)

    return result[0] ? toAdapterUser(result[0].user) : null
  },

  async linkAccount(account: AdapterAccount) {
    await getDb().insert(accounts).values(account)
    return account
  },

  async createVerificationToken(verificationToken: VerificationToken) {
    const inserted = await getDb()
      .insert(verificationTokens)
      .values(verificationToken)
      .returning()
    return inserted[0]
  },

  async useVerificationToken({ identifier, token }) {
    const deleted = await getDb()
      .delete(verificationTokens)
      .where(
        and(
          eq(verificationTokens.identifier, identifier),
          eq(verificationTokens.token, token),
        ),
      )
      .returning()

    return deleted[0] ?? null
  },
}

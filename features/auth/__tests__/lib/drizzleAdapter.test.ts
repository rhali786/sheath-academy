/** @jest-environment node */

/**
 * Drizzle auth adapter tests.
 * Require a real Postgres connection; skipped when DATABASE_URL is not set.
 */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { eq } from 'drizzle-orm'
import { drizzleAdapter } from '@/features/auth/lib/drizzleAdapter'
import { getDb } from '@/features/lib/server/db'
import { users, verificationTokens, accounts } from '@/db/schema'

const TS = Date.now()
const testEmail = `auth-adapter-${TS}@sheath.test`

async function cleanupTestUser() {
  if (!hasDb) return
  const db = getDb()
  const row = await db.select().from(users).where(eq(users.email, testEmail)).limit(1)
  if (row[0]) {
    await db.delete(accounts).where(eq(accounts.userId, row[0].id))
    await db.delete(users).where(eq(users.id, row[0].id))
  }
  await db.delete(verificationTokens).where(eq(verificationTokens.identifier, testEmail))
}

beforeEach(async () => {
  await cleanupTestUser()
})

afterAll(async () => {
  await cleanupTestUser()
})

describe('drizzleAdapter — verification tokens', () => {
  const token = {
    identifier: testEmail,
    token: `tok_${TS}`,
    expires: new Date(Date.now() + 15 * 60 * 1000),
  }

  itDb('createVerificationToken stores and returns the token', async () => {
    const result = await drizzleAdapter.createVerificationToken!(token)
    expect(result).toEqual(token)
  })

  itDb('useVerificationToken returns token and removes it (single-use)', async () => {
    await drizzleAdapter.createVerificationToken!(token)
    const result = await drizzleAdapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    })
    expect(result).toEqual(token)

    const second = await drizzleAdapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    })
    expect(second).toBeNull()
  })

  itDb('useVerificationToken returns null for unknown token', async () => {
    const result = await drizzleAdapter.useVerificationToken!({
      identifier: testEmail,
      token: 'does_not_exist',
    })
    expect(result).toBeNull()
  })

  itDb('useVerificationToken returns null when identifier does not match', async () => {
    await drizzleAdapter.createVerificationToken!(token)
    const result = await drizzleAdapter.useVerificationToken!({
      identifier: 'wrong@example.com',
      token: token.token,
    })
    expect(result).toBeNull()

    const retry = await drizzleAdapter.useVerificationToken!({
      identifier: token.identifier,
      token: token.token,
    })
    expect(retry).toEqual(token)
  })
})

describe('drizzleAdapter — users', () => {
  const newUser = {
    email: testEmail,
    emailVerified: null as Date | null,
    name: 'Test Parent',
    image: null as string | null,
  }

  itDb('createUser returns user with generated id', async () => {
    const user = await drizzleAdapter.createUser!(newUser)
    expect(user.id).toBeTruthy()
    expect(user.email).toBe(newUser.email)
  })

  itDb('getUser returns created user by id', async () => {
    const created = await drizzleAdapter.createUser!(newUser)
    const fetched = await drizzleAdapter.getUser!(created.id)
    expect(fetched?.email).toBe(created.email)
    expect(fetched?.id).toBe(created.id)
  })

  itDb('getUser returns null for unknown id', async () => {
    const result = await drizzleAdapter.getUser!('unknown')
    expect(result).toBeNull()
  })

  itDb('getUserByEmail returns user matching email', async () => {
    const created = await drizzleAdapter.createUser!(newUser)
    const fetched = await drizzleAdapter.getUserByEmail!(newUser.email)
    expect(fetched?.id).toBe(created.id)
  })

  itDb('getUserByEmail returns seeded user by email when present', async () => {
    const db = getDb()
    const seeded = await db
      .select()
      .from(users)
      .where(eq(users.email, process.env.DEV_SEED_USER_EMAIL ?? 'dev@sheathacademy.ai'))
      .limit(1)
    if (seeded.length === 0) {
      return
    }

    const fetched = await drizzleAdapter.getUserByEmail!(seeded[0].email)
    expect(fetched?.id).toBe(seeded[0].id)
  })

  itDb('getUserByEmail returns null when no match', async () => {
    const result = await drizzleAdapter.getUserByEmail!('nobody@example.com')
    expect(result).toBeNull()
  })

  itDb('updateUser merges fields and returns updated user', async () => {
    const created = await drizzleAdapter.createUser!(newUser)
    const updated = await drizzleAdapter.updateUser!({ id: created.id, name: 'Updated Name' })
    expect(updated.name).toBe('Updated Name')
    expect(updated.email).toBe(newUser.email)
  })

  itDb('createUser is idempotent when email already exists', async () => {
    const first = await drizzleAdapter.createUser!(newUser)
    const second = await drizzleAdapter.createUser!({ ...newUser, name: 'Other Name' })
    expect(second.id).toBe(first.id)
  })
})

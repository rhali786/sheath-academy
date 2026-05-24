/** @jest-environment node */

/**
 * Household repository tests.
 * Require a real Postgres connection; skipped automatically when DATABASE_URL is not set.
 * Run locally with .env.local populated.
 */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { upsertUserByEmail, upsertHouseholdForUser, getHouseholdForUser } from '../../server/repository'

const TS = Date.now()
const testEmail = `repo-test-${TS}@sheath.test`

afterAll(async () => {
  if (!hasDb) return
  // Best-effort cleanup of test rows
  const { getDb } = await import('@/features/lib/server/db')
  const { households, users } = await import('@/db/schema')
  const { eq } = await import('drizzle-orm')
  const db = getDb()
  const user = await db.select().from(users).where(eq(users.email, testEmail)).limit(1)
  if (user[0]) {
    await db.delete(households).where(eq(households.userId, user[0].id))
    await db.delete(users).where(eq(users.id, user[0].id))
  }
})

describe('household repository', () => {
  itDb('upsertUserByEmail creates a new user row', async () => {
    const user = await upsertUserByEmail(testEmail, 'Repo Test User')
    expect(user.id).toBeTruthy()
    expect(user.email).toBe(testEmail)
    expect(user.name).toBe('Repo Test User')
  })

  itDb('upsertUserByEmail is idempotent — returns same row on second call', async () => {
    const first = await upsertUserByEmail(testEmail)
    const second = await upsertUserByEmail(testEmail)
    expect(second.id).toBe(first.id)
  })

  itDb('upsertHouseholdForUser creates a household linked to user', async () => {
    const user = await upsertUserByEmail(testEmail)
    const household = await upsertHouseholdForUser(user.id, 'Test Household')
    expect(household.id).toBeTruthy()
    expect(household.userId).toBe(user.id)
    expect(household.name).toBe('Test Household')
  })

  itDb('upsertHouseholdForUser is idempotent — one household per user', async () => {
    const user = await upsertUserByEmail(testEmail)
    const first = await upsertHouseholdForUser(user.id)
    const second = await upsertHouseholdForUser(user.id)
    expect(second.id).toBe(first.id)
  })

  itDb('getHouseholdForUser returns the household', async () => {
    const user = await upsertUserByEmail(testEmail)
    await upsertHouseholdForUser(user.id, 'Test Household')
    const household = await getHouseholdForUser(user.id)
    expect(household).not.toBeNull()
    expect(household!.userId).toBe(user.id)
  })

  itDb('getHouseholdForUser returns null for unknown user', async () => {
    const household = await getHouseholdForUser('unknown-user-id-xyz')
    expect(household).toBeNull()
  })
})

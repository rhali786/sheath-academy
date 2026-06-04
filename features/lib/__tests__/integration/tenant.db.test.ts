/** @jest-environment node */

/**
 * DB-backed integration test for resolveTenant + the household repository.
 *
 * Unlike `../tenant.test.ts` (which MOCKS the repository boundary), this test
 * uses the REAL repository and REAL getDb() so the actual SQL runs against the
 * Postgres instance in DATABASE_URL. Its job is to surface SCHEMA DRIFT between
 * the Drizzle schema and the live database — the class of bug the mocked unit
 * test structurally cannot catch.
 *
 * Production symptom this reproduces: resolveTenant throws inside the NextAuth
 * JWT callback, so `householdId` is never set on the token and every API route
 * returns 403 setup_required via requireAuthCtx. If a table the repository
 * queries is missing, Postgres raises 42P01 and that surfaces here.
 *
 * Runs only when DATABASE_URL is set (skips gracefully in CI without a DB):
 *   npm run test:db
 * which loads .env.local via dotenv before invoking jest.
 *
 * Drizzle wraps query errors as "Failed query: ..." and puts the real
 * PostgresError on `error.cause`. The helper below re-surfaces .cause so the
 * true code/message (e.g. 42P01 relation "household_members" does not exist)
 * is visible in the failure output instead of being swallowed.
 */

import { resolveTenant } from '../../server/tenant'
import { closeDb } from '@/features/lib/server/db'
import {
  upsertUserByEmail,
  listHouseholdsForUser,
} from '@/features/household/server/repository'

const hasDb = !!process.env.DATABASE_URL
const describeDb = hasDb ? describe : describe.skip

// These are single round-trips to Postgres — they return in well under a second.
// A tight timeout means a hung connection (e.g. lock / unreachable DB) FAILS fast
// instead of stalling the whole run.
const DB_TIMEOUT_MS = 10_000

// Close the shared Postgres pool after the suite so the open socket doesn't keep
// the Node process alive ("Jest did not exit"). getDb() memoizes one connection.
afterAll(async () => {
  await closeDb()
})

// Verified to exist in the seeded DB (see scripts/verify-seed-user.js):
//   id: user_1779593647909, with household household_1779593648198.
const SEED_EMAIL = 'dev@sheath.local'

/** Drizzle hides the real PostgresError on .cause — pull it up so the
 *  code/message is visible and re-throw with both messages joined. */
async function surfacingCause<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    const e = err as { message?: string; cause?: { code?: string; message?: string } }
    const cause = e.cause
    const detail = cause
      ? `cause.code=${cause.code} cause.message=${cause.message}`
      : 'no .cause present'
    // eslint-disable-next-line no-console
    console.error(`[${label}] ${e.message}\n  ${detail}`)
    throw new Error(`${label} failed: ${e.message} | ${detail}`)
  }
}

describeDb('resolveTenant (real DB integration)', () => {
  it('resolves a userId and non-empty householdId for the seeded user without throwing', async () => {
    const ctx = await surfacingCause('resolveTenant', () =>
      resolveTenant({ user: { email: SEED_EMAIL } }),
    )

    expect(ctx.userId).toBeTruthy()
    expect(typeof ctx.householdId).toBe('string')
    expect(ctx.householdId.length).toBeGreaterThan(0)
    expect(ctx.memberships.length).toBeGreaterThan(0)
  }, DB_TIMEOUT_MS)
})

describeDb('household repository (real DB integration)', () => {
  it('upsertUserByEmail returns the seeded user row (isolates the users select)', async () => {
    const user = await surfacingCause('upsertUserByEmail', () =>
      upsertUserByEmail(SEED_EMAIL),
    )

    expect(user).toBeTruthy()
    expect(user.id).toBeTruthy()
    expect(user.email).toBe(SEED_EMAIL)
  }, DB_TIMEOUT_MS)

  it('listHouseholdsForUser returns >=1 membership for the seeded user', async () => {
    const user = await surfacingCause('upsertUserByEmail', () =>
      upsertUserByEmail(SEED_EMAIL),
    )

    const memberships = await surfacingCause('listHouseholdsForUser', () =>
      listHouseholdsForUser(user.id),
    )

    expect(Array.isArray(memberships)).toBe(true)
    expect(memberships.length).toBeGreaterThanOrEqual(1)
    expect(memberships[0].householdId.length).toBeGreaterThan(0)
  }, DB_TIMEOUT_MS)
})

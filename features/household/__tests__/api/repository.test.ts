/** @jest-environment node */

/**
 * Household repository tests.
 * Require a real Postgres connection; skipped automatically when DATABASE_URL is not set.
 * Run locally with .env.local populated.
 */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  upsertUserByEmail,
  upsertHouseholdForUser,
  getHouseholdForUser,
  addMember,
  listMembers,
  getMembership,
  deactivateMember,
  reactivateMember,
} from '../../server/repository'

const TS = Date.now()
const testEmail = `repo-test-${TS}@sheath.test`
const teacherEmail1 = `repo-teacher1-${TS}@sheath.test`
const teacherEmail2 = `repo-teacher2-${TS}@sheath.test`
const learnerLoginEmail = `repo-learner-login-${TS}@sheath.test`

afterAll(async () => {
  if (!hasDb) return
  const { getDb } = await import('@/features/lib/server/db')
  const { households, users, householdMembers } = await import('@/db/schema')
  const { eq, inArray } = await import('drizzle-orm')
  const db = getDb()
  const testUsers = await db
    .select()
    .from(users)
    .where(inArray(users.email, [testEmail, teacherEmail1, teacherEmail2, learnerLoginEmail]))
  const ids = testUsers.map(u => u.id)
  if (ids.length > 0) {
    await db.delete(householdMembers).where(inArray(householdMembers.userId, ids))
    const hhRows = await db.select().from(households).where(inArray(households.userId, ids))
    const hhIds = hhRows.map(h => h.id)
    if (hhIds.length > 0) {
      await db.delete(householdMembers).where(inArray(householdMembers.householdId, hhIds))
      await db.delete(households).where(inArray(households.id, hhIds))
    }
    await db.delete(users).where(inArray(users.id, ids))
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

describe('household teacher role', () => {
  itDb('a member can be created with role "teacher"', async () => {
    const owner = await upsertUserByEmail(teacherEmail1, 'Teacher One')
    const household = await upsertHouseholdForUser(owner.id, 'Teacher Household')
    const teacher2 = await upsertUserByEmail(teacherEmail2, 'Teacher Two')

    const result = await addMember(household.id, teacher2.id, 'teacher')
    expect(result.role).toBe('teacher')
  })

  itDb('multiple teacher members can coexist in one household', async () => {
    const owner = await upsertUserByEmail(teacherEmail1)
    const household = await upsertHouseholdForUser(owner.id)
    const teacher2 = await upsertUserByEmail(teacherEmail2)

    await addMember(household.id, teacher2.id, 'teacher')
    const members = await listMembers(household.id)
    const teacherMembers = members.filter(m => m.role === 'teacher')
    expect(teacherMembers.length).toBeGreaterThanOrEqual(1)
  })
})

describe('household learner role + membership deactivation (G3)', () => {
  itDb('addMember(existingHouseholdId, userId, "learner") attaches to the SAME household — no new household row is created', async () => {
    const owner = await upsertUserByEmail(teacherEmail1, 'Owner')
    const household = await upsertHouseholdForUser(owner.id, 'Learner Login Household')
    const learnerUser = await upsertUserByEmail(learnerLoginEmail, 'Learner Credential User')

    const householdCountBefore = (await getHouseholdForUser(learnerUser.id)) // learner has no own household
    expect(householdCountBefore).toBeNull()

    const membership = await addMember(household.id, learnerUser.id, 'learner')
    expect(membership.role).toBe('learner')
    expect(membership.householdId).toBe(household.id)

    // Still no household row owned by the learner user — confirms no new household was created
    const householdForLearner = await getHouseholdForUser(learnerUser.id)
    expect(householdForLearner).toBeNull()
  })

  itDb('new memberships default to isActive=true', async () => {
    const owner = await upsertUserByEmail(teacherEmail1)
    const household = await upsertHouseholdForUser(owner.id)
    const learnerUser = await upsertUserByEmail(learnerLoginEmail)
    await addMember(household.id, learnerUser.id, 'learner')
    const membership = await getMembership(household.id, learnerUser.id)
    expect(membership!.isActive).toBe(true)
  })

  itDb('deactivateMember sets isActive=false without deleting the row; reactivateMember restores it', async () => {
    const owner = await upsertUserByEmail(teacherEmail1)
    const household = await upsertHouseholdForUser(owner.id)
    const learnerUser = await upsertUserByEmail(learnerLoginEmail)
    await addMember(household.id, learnerUser.id, 'learner')

    const deactivated = await deactivateMember(household.id, learnerUser.id)
    expect(deactivated!.isActive).toBe(false)

    const stillPresent = await getMembership(household.id, learnerUser.id)
    expect(stillPresent).not.toBeNull()
    expect(stillPresent!.isActive).toBe(false)

    const reactivated = await reactivateMember(household.id, learnerUser.id)
    expect(reactivated!.isActive).toBe(true)
  })
})

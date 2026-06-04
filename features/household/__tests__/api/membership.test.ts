/** @jest-environment node */

/**
 * Household membership repository tests.
 * Require a real Postgres connection; skipped automatically when DATABASE_URL is not set.
 */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  upsertUserByEmail,
  upsertHouseholdForUser,
  addMember,
  removeMember,
  listMembers,
  listHouseholdsForUser,
  getMembership,
} from '../../server/repository'

const TS = Date.now()
const ownerEmail = `member-test-owner-${TS}@sheath.test`
const memberEmail = `member-test-member-${TS}@sheath.test`
const secondHhEmail = `member-test-secondhh-${TS}@sheath.test`

afterAll(async () => {
  if (!hasDb) return
  const { getDb } = await import('@/features/lib/server/db')
  const { households, users, householdMembers } = await import('@/db/schema')
  const { eq, inArray } = await import('drizzle-orm')
  const db = getDb()

  const testUsers = await db
    .select()
    .from(users)
    .where(inArray(users.email, [ownerEmail, memberEmail, secondHhEmail]))

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

describe('household membership repository', () => {
  describe('upsertHouseholdForUser — also creates owner membership', () => {
    itDb('creates an owner membership when creating a new household', async () => {
      const owner = await upsertUserByEmail(ownerEmail, 'Owner')
      const household = await upsertHouseholdForUser(owner.id, 'Owner Household')

      const membership = await getMembership(household.id, owner.id)
      expect(membership).not.toBeNull()
      expect(membership!.role).toBe('owner')
      expect(membership!.householdId).toBe(household.id)
      expect(membership!.userId).toBe(owner.id)
    })

    itDb('is idempotent — does not create duplicate membership on second call', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      await upsertHouseholdForUser(owner.id)
      await upsertHouseholdForUser(owner.id) // second call — should be no-op

      const members = await listMembers((await upsertHouseholdForUser(owner.id)).id)
      const ownerMembers = members.filter(m => m.userId === owner.id)
      expect(ownerMembers).toHaveLength(1)
    })
  })

  describe('addMember', () => {
    itDb('adds a member with default role "member"', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      const household = await upsertHouseholdForUser(owner.id)
      const member = await upsertUserByEmail(memberEmail, 'New Member')

      const result = await addMember(household.id, member.id)
      expect(result.householdId).toBe(household.id)
      expect(result.userId).toBe(member.id)
      expect(result.role).toBe('member')
    })

    itDb('can add a member with role "owner"', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      const household = await upsertHouseholdForUser(owner.id)
      const member = await upsertUserByEmail(memberEmail)

      const result = await addMember(household.id, member.id, 'owner')
      expect(result.role).toBe('owner')
    })

    itDb('is idempotent — does not create duplicate on second addMember call', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      const household = await upsertHouseholdForUser(owner.id)
      const member = await upsertUserByEmail(memberEmail)

      await addMember(household.id, member.id)
      await addMember(household.id, member.id) // second call

      const allMembers = await listMembers(household.id)
      const dupes = allMembers.filter(m => m.userId === member.id)
      expect(dupes).toHaveLength(1)
    })
  })

  describe('listMembers', () => {
    itDb('returns all members for a household', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      const household = await upsertHouseholdForUser(owner.id)
      const member = await upsertUserByEmail(memberEmail)
      await addMember(household.id, member.id)

      const members = await listMembers(household.id)
      const ids = members.map(m => m.userId)
      expect(ids).toContain(owner.id)
      expect(ids).toContain(member.id)
    })

    itDb('returns empty array for a household with no members', async () => {
      // Edge case: household with userId but memberships manually cleared (migration scenario)
      const members = await listMembers('nonexistent-household-id')
      expect(members).toEqual([])
    })
  })

  describe('listHouseholdsForUser', () => {
    itDb('returns all households a user belongs to', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      const hhA = await upsertHouseholdForUser(owner.id)

      // Create a second household owned by someone else and add owner as member
      const secondOwner = await upsertUserByEmail(secondHhEmail, 'Second Owner')
      const hhB = await upsertHouseholdForUser(secondOwner.id, 'Second Household')
      await addMember(hhB.id, owner.id)

      const households = await listHouseholdsForUser(owner.id)
      const hhIds = households.map(h => h.householdId)
      expect(hhIds).toContain(hhA.id)
      expect(hhIds).toContain(hhB.id)
    })

    itDb('returns empty array for a user with no memberships', async () => {
      const households = await listHouseholdsForUser('nonexistent-user-id')
      expect(households).toEqual([])
    })
  })

  describe('getMembership', () => {
    itDb('returns the membership row when it exists', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      const household = await upsertHouseholdForUser(owner.id)

      const membership = await getMembership(household.id, owner.id)
      expect(membership).not.toBeNull()
      expect(membership!.role).toBe('owner')
    })

    itDb('returns null when membership does not exist', async () => {
      const membership = await getMembership('nonexistent-hh', 'nonexistent-user')
      expect(membership).toBeNull()
    })
  })

  describe('removeMember', () => {
    itDb('removes a member from a household', async () => {
      const owner = await upsertUserByEmail(ownerEmail)
      const household = await upsertHouseholdForUser(owner.id)
      const member = await upsertUserByEmail(memberEmail)
      await addMember(household.id, member.id)

      await removeMember(household.id, member.id)

      const membership = await getMembership(household.id, member.id)
      expect(membership).toBeNull()
    })

    itDb('is a no-op when membership does not exist', async () => {
      // Should not throw
      await expect(removeMember('nonexistent-hh', 'nonexistent-user')).resolves.not.toThrow()
    })
  })
})

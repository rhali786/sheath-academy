/** @jest-environment node */

/**
 * DB-backed integration tests for the badges repository.
 * Runs only when DATABASE_URL is set (npm run test:db).
 * Tests use real getDb() — do NOT mock it.
 */

import { getDb, closeDb } from '@/features/lib/server/db'
import {
  users,
  households,
  learners,
  badgeDefinitions,
  badgeAwards,
  badgeAwardEvidence,
  portfolioEvidence,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  listBadgeDefinitions,
  listBadgeCollection,
  listBadgeAwards,
  getBadgeSettings,
  createAward,
  addEvidenceToAward,
} from '@/features/badges/server/repository'

const hasDb = !!process.env.DATABASE_URL
const describeDb = hasDb ? describe : describe.skip

const DB_TIMEOUT_MS = 15_000

afterAll(async () => {
  await closeDb()
})

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function testIds(prefix: string) {
  const uid = `user_dbtest_badges_${prefix}`
  const hid = `hh_dbtest_badges_${prefix}`
  const lid = `learner_dbtest_badges_${prefix}`
  return { uid, hid, lid }
}

async function insertBaseFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  const now = new Date()
  await db.insert(users).values({
    id: ids.uid,
    email: `${ids.uid}@test.local`,
    name: 'Test User',
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()
  await db.insert(households).values({
    id: ids.hid,
    userId: ids.uid,
    name: 'Test Household',
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()
  await db.insert(learners).values({
    id: ids.lid,
    householdId: ids.hid,
    name: 'Test Learner',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()
}

async function cleanupBaseFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  // Delete in FK-safe reverse order
  await db.delete(badgeAwardEvidence).where(eq(badgeAwardEvidence.householdId, ids.hid))
  await db.delete(badgeAwards).where(eq(badgeAwards.householdId, ids.hid))
  await db.delete(portfolioEvidence).where(eq(portfolioEvidence.householdId, ids.hid))
  await db.delete(learners).where(eq(learners.id, ids.lid))
  await db.delete(households).where(eq(households.id, ids.hid))
  await db.delete(users).where(eq(users.id, ids.uid))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describeDb('badges repository (real DB)', () => {
  // ─── listBadgeDefinitions ────────────────────────────────────────────────────

  describe('listBadgeDefinitions — returns starter + custom', () => {
    const ids = testIds('lbd1')
    const starterDefId = 'badge_dbtest_badges_lbd1_starter'
    const customDefId = 'badge_dbtest_badges_lbd1_custom'

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(badgeDefinitions).values([
        {
          id: starterDefId,
          householdId: null, // starter badge — visible to all households
          title: 'DB Test Starter Badge',
          description: 'A starter badge for testing',
          criteria: 'Complete the test',
          emblemKey: 'test_starter',
          gradeBands: ['g1_4', 'g5_8'],
          verificationRequirement: 'parent',
          isStarter: true,
          enabled: true,
          visibility: 'platform',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: customDefId,
          householdId: ids.hid, // custom household badge
          title: 'DB Test Custom Badge',
          description: 'A custom household badge for testing',
          criteria: 'Complete the custom test',
          emblemKey: 'test_custom',
          gradeBands: ['g9_12'],
          verificationRequirement: 'none',
          isStarter: false,
          enabled: true,
          visibility: 'household',
          createdAt: now,
          updatedAt: now,
        },
      ]).onConflictDoNothing()
    })
    afterAll(async () => {
      const db = getDb()
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, customDefId))
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, starterDefId))
      await cleanupBaseFixtures(ids)
    })

    it('listBadgeDefinitions returns starter badges (householdId null) plus household custom', async () => {
      const defs = await listBadgeDefinitions(ids.hid)
      const starterFound = defs.find(d => d.id === starterDefId)
      const customFound = defs.find(d => d.id === customDefId)
      expect(starterFound).toBeDefined()
      expect(starterFound!.isStarter).toBe(true)
      expect(starterFound!.householdId).toBeNull()
      expect(customFound).toBeDefined()
      expect(customFound!.isStarter).toBe(false)
      expect(customFound!.householdId).toBe(ids.hid)
    }, DB_TIMEOUT_MS)
  })

  // ─── listBadgeCollection — earned ─────────────────────────────────────────────

  describe('listBadgeCollection — marks earned badges isEarned:true', () => {
    const ids = testIds('lbc1')
    const defId = 'badge_dbtest_badges_lbc1_def'
    const awardId = 'award_dbtest_badges_lbc1_aw'

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(badgeDefinitions).values({
        id: defId,
        householdId: null,
        title: 'DB Test Earned Badge',
        description: 'A badge for testing earned state',
        criteria: 'Test criteria',
        emblemKey: 'test_earned',
        gradeBands: [],
        verificationRequirement: 'none',
        isStarter: true,
        enabled: true,
        visibility: 'platform',
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
      await db.insert(badgeAwards).values({
        id: awardId,
        householdId: ids.hid,
        learnerId: ids.lid,
        badgeId: defId,
        status: 'verified',
        submittedAt: now,
        verifiedAt: now,
        approvedAt: now,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
    })
    afterAll(async () => {
      await cleanupBaseFixtures(ids)
      const db = getDb()
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, defId))
    })

    it('listBadgeCollection marks earned badges isEarned:true', async () => {
      const collection = await listBadgeCollection(ids.hid, ids.lid)
      const item = collection.find(c => c.definition.id === defId)
      expect(item).toBeDefined()
      expect(item!.isEarned).toBe(true)
      expect(item!.award).not.toBeNull()
      expect(item!.award!.status).toBe('verified')
    }, DB_TIMEOUT_MS)
  })

  // ─── listBadgeCollection — unearned ───────────────────────────────────────────

  describe('listBadgeCollection — marks unearned badges isEarned:false', () => {
    const ids = testIds('lbc2')
    const defId = 'badge_dbtest_badges_lbc2_def'

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(badgeDefinitions).values({
        id: defId,
        householdId: null,
        title: 'DB Test Unearned Badge',
        description: 'A badge for testing unearned state',
        criteria: 'Test criteria',
        emblemKey: 'test_unearned',
        gradeBands: [],
        verificationRequirement: 'none',
        isStarter: true,
        enabled: true,
        visibility: 'platform',
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
      // No award inserted
    })
    afterAll(async () => {
      await cleanupBaseFixtures(ids)
      const db = getDb()
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, defId))
    })

    it('listBadgeCollection marks unearned badges isEarned:false', async () => {
      const collection = await listBadgeCollection(ids.hid, ids.lid)
      const item = collection.find(c => c.definition.id === defId)
      expect(item).toBeDefined()
      expect(item!.isEarned).toBe(false)
      expect(item!.award).toBeNull()
    }, DB_TIMEOUT_MS)
  })

  // ─── getBadgeSettings ─────────────────────────────────────────────────────────

  describe('getBadgeSettings — returns default when no row exists', () => {
    it('getBadgeSettings returns default true when no row exists', async () => {
      const settings = await getBadgeSettings('hh_dbtest_badges_unknown_hh')
      expect(settings.platformBadgesEnabled).toBe(true)
      expect(settings.householdId).toBe('hh_dbtest_badges_unknown_hh')
    }, DB_TIMEOUT_MS)
  })

  // ─── createAward + listBadgeAwards ────────────────────────────────────────────

  describe('createAward + listBadgeAwards round-trip', () => {
    const ids = testIds('ca1')
    const defId = 'badge_dbtest_badges_ca1_def'

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(badgeDefinitions).values({
        id: defId,
        householdId: null,
        title: 'DB Test Award Badge',
        description: 'A badge for testing award creation',
        criteria: 'Test criteria',
        emblemKey: 'test_award',
        gradeBands: [],
        verificationRequirement: 'none',
        isStarter: true,
        enabled: true,
        visibility: 'platform',
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
    })
    afterAll(async () => {
      await cleanupBaseFixtures(ids)
      const db = getDb()
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, defId))
    })

    it('createAward + listBadgeAwards round-trip', async () => {
      await createAward(ids.hid, { learnerId: ids.lid, badgeId: defId, status: 'draft' })
      const awards = await listBadgeAwards(ids.hid, ids.lid)
      expect(awards).toHaveLength(1)
      expect(awards[0].learnerId).toBe(ids.lid)
      expect(awards[0].badgeId).toBe(defId)
      expect(awards[0].status).toBe('draft')
    }, DB_TIMEOUT_MS)
  })

  // ─── addEvidenceToAward — household isolation ─────────────────────────────────

  describe('badge_award_evidence is household-isolated', () => {
    const idsA = testIds('aeta')
    const idsB = testIds('aetb')
    const defId = 'badge_dbtest_badges_aeta_def'

    beforeAll(async () => {
      await insertBaseFixtures(idsA)
      await insertBaseFixtures(idsB)
      const db = getDb()
      const now = new Date()
      await db.insert(badgeDefinitions).values({
        id: defId,
        householdId: null,
        title: 'DB Test Evidence Isolation Badge',
        description: 'A badge for testing evidence isolation',
        criteria: 'Test criteria',
        emblemKey: 'test_isolation',
        gradeBands: [],
        verificationRequirement: 'none',
        isStarter: true,
        enabled: true,
        visibility: 'platform',
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
      // Insert a portfolioEvidence row for householdA
      await db.insert(portfolioEvidence).values({
        id: `ev_dbtest_badges_aeta_1`,
        householdId: idsA.hid,
        learnerId: idsA.lid,
        title: 'Test Evidence',
        evidenceType: 'document',
        evidenceDate: '2026-01-01',
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
    })
    afterAll(async () => {
      await cleanupBaseFixtures(idsA)
      await cleanupBaseFixtures(idsB)
      const db = getDb()
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, defId))
    })

    it('badge_award_evidence is household-isolated', async () => {
      // Create an award for householdA and add evidence to it
      const award = await createAward(idsA.hid, { learnerId: idsA.lid, badgeId: defId, status: 'draft' })
      await addEvidenceToAward(idsA.hid, {
        badgeAwardId: award.id,
        evidenceId: 'ev_dbtest_badges_aeta_1',
      })

      // listBadgeAwards for householdB must not return householdA's award
      const awardsB = await listBadgeAwards(idsB.hid, idsB.lid)
      expect(awardsB.every(a => a.householdId === idsB.hid)).toBe(true)
      expect(awardsB.find(a => a.id === award.id)).toBeUndefined()
    }, DB_TIMEOUT_MS)
  })
})

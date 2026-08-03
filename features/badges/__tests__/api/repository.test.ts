/** @jest-environment node */

/**
 * DB-backed tests for the phase-4 badge additions: custom badge images
 * (badge_definitions.imageUrl) and award progress tracking
 * (badge_awards.progressCurrent/progressTarget).
 *
 * Runs only when DATABASE_URL is set. Tests use real getDb() — do NOT mock it.
 * Mirrors features/badges/__tests__/integration/repository.db.test.ts's fixture
 * conventions.
 */

import { getDb, closeDb } from '@/features/lib/server/db'
import { users, households, learners, badgeDefinitions, badgeAwards } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  createBadgeDefinition,
  updateBadgeDefinition,
  createAward,
  updateAwardProgress,
  listBadgeAwards,
} from '@/features/badges/server/repository'

const hasDb = !!process.env.DATABASE_URL
const describeDb = hasDb ? describe : describe.skip

const DB_TIMEOUT_MS = 15_000

afterAll(async () => {
  await closeDb()
})

function testIds(prefix: string) {
  const uid = `user_dbtest_badges_p4_${prefix}`
  const hid = `hh_dbtest_badges_p4_${prefix}`
  const lid = `learner_dbtest_badges_p4_${prefix}`
  return { uid, hid, lid }
}

async function insertBaseFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  const now = new Date()
  await db.insert(users).values({
    id: ids.uid, email: `${ids.uid}@test.local`, name: 'Test User', createdAt: now, updatedAt: now,
  }).onConflictDoNothing()
  await db.insert(households).values({
    id: ids.hid, userId: ids.uid, name: 'Test Household', createdAt: now, updatedAt: now,
  }).onConflictDoNothing()
  await db.insert(learners).values({
    id: ids.lid, householdId: ids.hid, name: 'Test Learner', sortOrder: 0, createdAt: now, updatedAt: now,
  }).onConflictDoNothing()
}

async function cleanupBaseFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  await db.delete(badgeAwards).where(eq(badgeAwards.householdId, ids.hid))
  await db.delete(learners).where(eq(learners.id, ids.lid))
  await db.delete(households).where(eq(households.id, ids.hid))
  await db.delete(users).where(eq(users.id, ids.uid))
}

describeDb('badges repository — phase 4 (imageUrl + award progress)', () => {
  describe('createBadgeDefinition — imageUrl', () => {
    const ids = testIds('img')

    beforeAll(async () => { await insertBaseFixtures(ids) })
    afterAll(async () => {
      const db = getDb()
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.householdId, ids.hid))
      await cleanupBaseFixtures(ids)
    })

    it('creating a badge definition with imageUrl persists and returns it', async () => {
      const def = await createBadgeDefinition(ids.hid, {
        title: 'Custom Image Badge',
        description: 'desc',
        criteria: 'do the thing',
        emblemKey: 'custom-img',
        imageUrl: 'https://example.com/badge.png',
      })
      expect(def.imageUrl).toBe('https://example.com/badge.png')

      const rows = await getDb().select().from(badgeDefinitions).where(eq(badgeDefinitions.id, def.id))
      expect(rows[0].imageUrl).toBe('https://example.com/badge.png')
    }, DB_TIMEOUT_MS)

    it('updating imageUrl on an existing definition persists and round-trips', async () => {
      const def = await createBadgeDefinition(ids.hid, {
        title: 'No Image Yet', description: 'd', criteria: 'c', emblemKey: 'e',
      })
      expect(def.imageUrl).toBeNull()

      const updated = await updateBadgeDefinition(def.id, ids.hid, { imageUrl: 'https://example.com/updated.png' })
      expect(updated).not.toBeNull()
      expect(updated!.imageUrl).toBe('https://example.com/updated.png')
    }, DB_TIMEOUT_MS)
  })

  describe('updateAwardProgress', () => {
    const ids = testIds('prog')
    const defId = 'badge_dbtest_badges_p4_prog_def'

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(badgeDefinitions).values({
        id: defId, householdId: null, title: 'DB Test Progress Badge', description: 'd', criteria: 'c',
        emblemKey: 'test_progress', gradeBands: [], verificationRequirement: 'none', isStarter: true,
        enabled: true, visibility: 'platform', createdAt: now, updatedAt: now,
      }).onConflictDoNothing()
    })
    afterAll(async () => {
      await cleanupBaseFixtures(ids)
      const db = getDb()
      await db.delete(badgeDefinitions).where(eq(badgeDefinitions.id, defId))
    })

    it('updating progressCurrent on an award persists and round-trips', async () => {
      const award = await createAward(ids.hid, { learnerId: ids.lid, badgeId: defId, status: 'draft' })
      expect(award.progressCurrent ?? null).toBeNull()

      const updated = await updateAwardProgress(award.id, ids.hid, { progressCurrent: 5, progressTarget: 10 })
      expect(updated).not.toBeNull()
      expect(updated!.progressCurrent).toBe(5)
      expect(updated!.progressTarget).toBe(10)

      const awards = await listBadgeAwards(ids.hid, ids.lid)
      const found = awards.find(a => a.id === award.id)
      expect(found!.progressCurrent).toBe(5)
      expect(found!.progressTarget).toBe(10)
    }, DB_TIMEOUT_MS)

    it('returns null for an award in a foreign household', async () => {
      const award = await createAward(ids.hid, { learnerId: ids.lid, badgeId: defId, status: 'draft' })
      const result = await updateAwardProgress(award.id, 'hh_nope', { progressCurrent: 1, progressTarget: 2 })
      expect(result).toBeNull()
    }, DB_TIMEOUT_MS)
  })
})

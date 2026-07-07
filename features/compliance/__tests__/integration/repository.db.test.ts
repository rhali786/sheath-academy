/** @jest-environment node */

/**
 * DB-backed integration tests for the compliance repository.
 * Runs only when DATABASE_URL is set (npm run test:db).
 * Tests use real getDb() — do NOT mock it.
 */

import { getDb, closeDb } from '@/features/lib/server/db'
import {
  users,
  households,
  schoolYears,
  complianceRulesets,
  householdComplianceConfig,
  complianceDeadlines,
  complianceSubmissions,
} from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  getActiveRuleset,
  listDeadlines,
  listSubmissions,
  createDeadline,
  markDeadlineComplete,
  createSubmission,
  updateDeadline,
  deleteDeadline,
  deleteSubmission,
  listRulesets,
} from '@/features/compliance/server/repository'

const hasDb = !!process.env.DATABASE_URL
const describeDb = hasDb ? describe : describe.skip

const DB_TIMEOUT_MS = 15_000

afterAll(async () => {
  await closeDb()
})

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function testIds(prefix: string) {
  const uid = `user_dbtest_comp_${prefix}`
  const hid = `hh_dbtest_comp_${prefix}`
  const syid = `sy_dbtest_comp_${prefix}`
  return { uid, hid, syid }
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
  await db.insert(schoolYears).values({
    id: ids.syid,
    householdId: ids.hid,
    name: 'Test Year',
    startDate: '2025-08-01',
    endDate: '2026-05-31',
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()
}

async function cleanupBaseFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  // Delete in FK-safe reverse order
  await db.delete(complianceSubmissions).where(eq(complianceSubmissions.householdId, ids.hid))
  await db.delete(complianceDeadlines).where(eq(complianceDeadlines.householdId, ids.hid))
  await db.delete(householdComplianceConfig).where(eq(householdComplianceConfig.householdId, ids.hid))
  await db.delete(schoolYears).where(eq(schoolYears.householdId, ids.hid))
  await db.delete(households).where(eq(households.id, ids.hid))
  await db.delete(users).where(eq(users.id, ids.uid))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describeDb('compliance repository (real DB)', () => {
  // ─── getActiveRuleset ───────────────────────────────────────────────────────

  describe('getActiveRuleset — no config row', () => {
    const ids = testIds('gar1')

    beforeAll(async () => { await insertBaseFixtures(ids) })
    afterAll(async () => { await cleanupBaseFixtures(ids) })

    it('getActiveRuleset returns null when no config row exists', async () => {
      const result = await getActiveRuleset(ids.hid)
      expect(result).toBeNull()
    }, DB_TIMEOUT_MS)
  })

  describe('getActiveRuleset — with config row', () => {
    const ids = testIds('gar2')
    const rulesetId = 'ruleset_dbtest_comp_gar2'

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(complianceRulesets).values({
        id: rulesetId,
        state: 'TX',
        pathwayKey: 'private-school-exemption',
        requirementType: 'days',
        value: '180',
        unit: 'days',
        sourceUrl: null,
        lastVerifiedAt: null,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
      await db.insert(householdComplianceConfig).values({
        householdId: ids.hid,
        activeRulesetId: rulesetId,
        pathwayKey: 'private-school-exemption',
        updatedAt: now,
      }).onConflictDoNothing()
    })
    afterAll(async () => {
      await cleanupBaseFixtures(ids)
      const db = getDb()
      await db.delete(complianceRulesets).where(eq(complianceRulesets.id, rulesetId))
    })

    it('getActiveRuleset returns ruleset after config row inserted', async () => {
      const result = await getActiveRuleset(ids.hid)
      expect(result).not.toBeNull()
      expect(result!.state).toBe('TX')
      expect(result!.isVerified).toBe(true)
      expect(result!.pathwayKey).toBe('private-school-exemption')
    }, DB_TIMEOUT_MS)
  })

  // ─── listDeadlines ──────────────────────────────────────────────────────────

  describe('listDeadlines — household isolation', () => {
    const idsA = testIds('ld_a')
    const idsB = testIds('ld_b')

    beforeAll(async () => {
      await insertBaseFixtures(idsA)
      await insertBaseFixtures(idsB)
      const db = getDb()
      const now = new Date()
      // Two deadlines for householdA
      await db.insert(complianceDeadlines).values([
        {
          id: `deadline_dbtest_comp_ld_a_1`,
          householdId: idsA.hid,
          schoolYearId: idsA.syid,
          label: 'Annual Notification',
          dueDate: '2026-09-01',
          isCompleted: false,
          requirementType: 'filing',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: `deadline_dbtest_comp_ld_a_2`,
          householdId: idsA.hid,
          schoolYearId: idsA.syid,
          label: 'Portfolio Submission',
          dueDate: '2026-10-01',
          isCompleted: false,
          requirementType: 'portfolio',
          createdAt: now,
          updatedAt: now,
        },
      ]).onConflictDoNothing()
      // One deadline for householdB
      await db.insert(complianceDeadlines).values({
        id: `deadline_dbtest_comp_ld_b_1`,
        householdId: idsB.hid,
        schoolYearId: idsB.syid,
        label: 'Annual Notification B',
        dueDate: '2026-09-01',
        isCompleted: false,
        requirementType: 'filing',
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
    })
    afterAll(async () => {
      await cleanupBaseFixtures(idsA)
      await cleanupBaseFixtures(idsB)
    })

    it('listDeadlines returns rows for the correct household+schoolYear only', async () => {
      const deadlinesA = await listDeadlines(idsA.hid, idsA.syid)
      expect(deadlinesA).toHaveLength(2)
      expect(deadlinesA.every(d => d.householdId === idsA.hid)).toBe(true)
    }, DB_TIMEOUT_MS)
  })

  // ─── listSubmissions ────────────────────────────────────────────────────────

  describe('listSubmissions — returns submissions', () => {
    const ids = testIds('ls1')

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      const earlier = new Date(now.getTime() - 60_000)
      await db.insert(complianceSubmissions).values([
        {
          id: `submission_dbtest_comp_ls1_1`,
          householdId: ids.hid,
          schoolYearId: ids.syid,
          status: 'drafted',
          submittedAt: null,
          acceptedAt: null,
          snapshotJson: null,
          createdAt: earlier,
          updatedAt: earlier,
        },
        {
          id: `submission_dbtest_comp_ls1_2`,
          householdId: ids.hid,
          schoolYearId: ids.syid,
          status: 'sent',
          submittedAt: now,
          acceptedAt: null,
          snapshotJson: null,
          createdAt: now,
          updatedAt: now,
        },
      ]).onConflictDoNothing()
    })
    afterAll(async () => { await cleanupBaseFixtures(ids) })

    it('listSubmissions returns submissions for the household+schoolYear', async () => {
      const submissions = await listSubmissions(ids.hid, ids.syid)
      expect(submissions).toHaveLength(2)
      expect(submissions.every(s => s.householdId === ids.hid)).toBe(true)
    }, DB_TIMEOUT_MS)
  })

  // ─── createDeadline + markDeadlineComplete ──────────────────────────────────

  describe('createDeadline + markDeadlineComplete round-trip', () => {
    const ids = testIds('cdmc')

    beforeAll(async () => { await insertBaseFixtures(ids) })
    afterAll(async () => { await cleanupBaseFixtures(ids) })

    it('createDeadline + markDeadlineComplete sets isCompleted=true', async () => {
      const deadline = await createDeadline(ids.hid, {
        schoolYearId: ids.syid,
        label: 'Annual filing',
        dueDate: '2026-09-01',
        requirementType: 'filing',
      })

      expect(deadline.id).toBeTruthy()
      expect(deadline.isCompleted).toBe(false)

      await markDeadlineComplete(deadline.id, ids.hid)

      const list = await listDeadlines(ids.hid, ids.syid)
      const updated = list.find(d => d.id === deadline.id)
      expect(updated).toBeDefined()
      expect(updated!.isCompleted).toBe(true)
    }, DB_TIMEOUT_MS)
  })

  // ─── updateDeadline / deleteDeadline / deleteSubmission / listRulesets (Phase 2) ─

  describe('updateDeadline + deleteDeadline', () => {
    const ids = testIds('upd')

    beforeAll(async () => { await insertBaseFixtures(ids) })
    afterAll(async () => { await cleanupBaseFixtures(ids) })

    it('updateDeadline edits label/dueDate and toggles completion', async () => {
      const created = await createDeadline(ids.hid, {
        schoolYearId: ids.syid, label: 'Old label', dueDate: '2026-09-01', requirementType: 'filing',
      })

      const updated = await updateDeadline(created.id, ids.hid, {
        label: 'New label', dueDate: '2026-10-15', isCompleted: true,
      })
      expect(updated).not.toBeNull()
      expect(updated!.label).toBe('New label')
      expect(updated!.dueDate).toBe('2026-10-15')
      expect(updated!.isCompleted).toBe(true)

      // reopen
      const reopened = await updateDeadline(created.id, ids.hid, { isCompleted: false })
      expect(reopened!.isCompleted).toBe(false)
    }, DB_TIMEOUT_MS)

    it('updateDeadline returns null for a foreign household', async () => {
      const created = await createDeadline(ids.hid, {
        schoolYearId: ids.syid, label: 'X', dueDate: '2026-09-01', requirementType: 'filing',
      })
      const result = await updateDeadline(created.id, 'hh_nope', { label: 'Y' })
      expect(result).toBeNull()
    }, DB_TIMEOUT_MS)

    it('deleteDeadline removes the row and returns true; false when gone', async () => {
      const created = await createDeadline(ids.hid, {
        schoolYearId: ids.syid, label: 'To delete', dueDate: '2026-09-01', requirementType: 'filing',
      })
      expect(await deleteDeadline(created.id, ids.hid)).toBe(true)
      expect((await listDeadlines(ids.hid, ids.syid)).find(d => d.id === created.id)).toBeUndefined()
      expect(await deleteDeadline(created.id, ids.hid)).toBe(false)
    }, DB_TIMEOUT_MS)
  })

  describe('deleteSubmission', () => {
    const ids = testIds('dsub')

    beforeAll(async () => { await insertBaseFixtures(ids) })
    afterAll(async () => { await cleanupBaseFixtures(ids) })

    it('deleteSubmission removes the row and returns true; false when gone', async () => {
      const created = await createSubmission(ids.hid, { schoolYearId: ids.syid })
      expect(await deleteSubmission(created.id, ids.hid)).toBe(true)
      expect((await listSubmissions(ids.hid, ids.syid)).find(s => s.id === created.id)).toBeUndefined()
      expect(await deleteSubmission(created.id, ids.hid)).toBe(false)
    }, DB_TIMEOUT_MS)
  })

  describe('listRulesets', () => {
    const ids = testIds('rs')
    const rulesetId = 'ruleset_dbtest_comp_rs1'

    beforeAll(async () => {
      await insertBaseFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(complianceRulesets).values({
        id: rulesetId,
        state: 'TX',
        pathwayKey: 'private-school-exemption',
        requirementType: 'days',
        value: '180',
        unit: 'days',
        sourceUrl: null,
        lastVerifiedAt: null,
        isVerified: true,
        createdAt: now,
        updatedAt: now,
      }).onConflictDoNothing()
    })
    afterAll(async () => {
      await cleanupBaseFixtures(ids)
      const db = getDb()
      await db.delete(complianceRulesets).where(eq(complianceRulesets.id, rulesetId))
    })

    it('listRulesets includes the inserted ruleset', async () => {
      const rulesets = await listRulesets()
      expect(rulesets.find(r => r.id === rulesetId)).toBeDefined()
    }, DB_TIMEOUT_MS)
  })
})

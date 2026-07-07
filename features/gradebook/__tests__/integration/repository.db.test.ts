/** @jest-environment node */

/**
 * DB-backed integration tests for the gradebook repository.
 * Runs only when DATABASE_URL is set (npm run test:db).
 * Tests use real getDb() — do NOT mock it.
 */

import { getDb, closeDb } from '@/features/lib/server/db'
import { users, households, learners, subjects, scores, gradingScales, aggregationRules } from '@/db/schema'
import { eq, and } from 'drizzle-orm'
import {
  createScore, listScores, listGradebookSummaries, updateScore, deleteScore,
  createGradingScale, listGradingScales, updateGradingScale, deleteGradingScale,
  createAggregationRule, listAggregationRules, updateAggregationRule, deleteAggregationRule,
} from '@/features/gradebook/server/repository'

const hasDb = !!process.env.DATABASE_URL
const describeDb = hasDb ? describe : describe.skip

const DB_TIMEOUT_MS = 15_000

afterAll(async () => {
  await closeDb()
})

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function testIds(prefix: string) {
  const uid = `user_dbtest_gb_${prefix}`
  const hid = `hh_dbtest_gb_${prefix}`
  const lid = `learner_dbtest_gb_${prefix}`
  const sid = `sub_dbtest_gb_${prefix}`
  return { uid, hid, lid, sid }
}

async function insertFixtures(ids: ReturnType<typeof testIds>) {
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
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()
  await db.insert(subjects).values({
    id: ids.sid,
    householdId: ids.hid,
    learnerId: ids.lid,
    name: 'Test Subject',
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing()
}

async function cleanupFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  // Delete in FK-safe reverse order
  await db.delete(scores).where(eq(scores.householdId, ids.hid))
  await db.delete(subjects).where(eq(subjects.householdId, ids.hid))
  await db.delete(gradingScales).where(eq(gradingScales.householdId, ids.hid))
  await db.delete(aggregationRules).where(eq(aggregationRules.householdId, ids.hid))
  await db.delete(learners).where(eq(learners.householdId, ids.hid))
  await db.delete(households).where(eq(households.id, ids.hid))
  await db.delete(users).where(eq(users.id, ids.uid))
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describeDb('gradebook repository (real DB)', () => {
  describe('createScore + listScores', () => {
    const ids = testIds('cs1')

    beforeAll(async () => { await insertFixtures(ids) })
    afterAll(async () => { await cleanupFixtures(ids) })

    it('createScore + listScores returns the score', async () => {
      const score = await createScore(ids.hid, {
        learnerId: ids.lid,
        subjectId: ids.sid,
        state: 'graded',
        numericValue: 85,
        source: 'parent',
        occurredAt: new Date('2026-05-01').toISOString(),
      })

      expect(score.id).toBeTruthy()
      expect(score.householdId).toBe(ids.hid)

      const list = await listScores(ids.hid, ids.lid, ids.sid)
      expect(list).toHaveLength(1)
      expect(list[0].numericValue).toBe(85)
      expect(list[0].state).toBe('graded')
    }, DB_TIMEOUT_MS)
  })

  describe('listScores — missing/excused numericValue is null', () => {
    const ids = testIds('cs2')

    beforeAll(async () => { await insertFixtures(ids) })
    afterAll(async () => { await cleanupFixtures(ids) })

    it('listScores with missing state — numericValue is null, not 0', async () => {
      await createScore(ids.hid, {
        learnerId: ids.lid,
        subjectId: ids.sid,
        state: 'missing',
        numericValue: null,
        source: 'parent',
        occurredAt: new Date('2026-05-02').toISOString(),
      })

      const list = await listScores(ids.hid, ids.lid, ids.sid)
      expect(list.length).toBeGreaterThanOrEqual(1)
      const missingScore = list.find(s => s.state === 'missing')
      expect(missingScore).toBeDefined()
      expect(missingScore!.numericValue).toBeNull()
    }, DB_TIMEOUT_MS)
  })

  describe('listScores — household isolation', () => {
    const idsA = testIds('iso_a')
    const idsB = testIds('iso_b')

    beforeAll(async () => {
      await insertFixtures(idsA)
      await insertFixtures(idsB)
    })
    afterAll(async () => {
      await cleanupFixtures(idsA)
      await cleanupFixtures(idsB)
    })

    it('listScores for householdA does not return householdB scores', async () => {
      await createScore(idsA.hid, {
        learnerId: idsA.lid,
        subjectId: idsA.sid,
        state: 'graded',
        numericValue: 90,
        source: 'parent',
        occurredAt: new Date('2026-05-03').toISOString(),
      })
      await createScore(idsB.hid, {
        learnerId: idsB.lid,
        subjectId: idsB.sid,
        state: 'graded',
        numericValue: 70,
        source: 'parent',
        occurredAt: new Date('2026-05-03').toISOString(),
      })

      const listA = await listScores(idsA.hid, idsA.lid, idsA.sid)
      expect(listA.every(s => s.householdId === idsA.hid)).toBe(true)
      const listB = await listScores(idsB.hid, idsB.lid, idsB.sid)
      expect(listB.every(s => s.householdId === idsB.hid)).toBe(true)
      // Cross-household: householdA query must not return householdB score
      const crossCheck = listA.find(s => s.householdId === idsB.hid)
      expect(crossCheck).toBeUndefined()
    }, DB_TIMEOUT_MS)
  })

  describe('listGradebookSummaries — includes real scores', () => {
    const ids = testIds('summ')

    beforeAll(async () => { await insertFixtures(ids) })
    afterAll(async () => { await cleanupFixtures(ids) })

    it('listGradebookSummaries includes real scores when graded score exists', async () => {
      await createScore(ids.hid, {
        learnerId: ids.lid,
        subjectId: ids.sid,
        state: 'graded',
        numericValue: 90,
        source: 'parent',
        occurredAt: new Date('2026-05-04').toISOString(),
      })

      const summaries = await listGradebookSummaries(ids.hid)
      const learnerSummary = summaries.find(s => s.learnerId === ids.lid)
      expect(learnerSummary).toBeDefined()

      const subjectResult = learnerSummary!.subjects.find(s => s.subjectId === ids.sid)
      expect(subjectResult).toBeDefined()
      expect(subjectResult!.pointsAverage).toBeCloseTo(90, 1)
    }, DB_TIMEOUT_MS)
  })

  describe('listGradebookSummaries — GPA reflects stored creditHours (Phase 0)', () => {
    const ids = testIds('credits')
    // Two subjects with different credit hours on the same learner.
    const sidA = `${ids.sid}_a` // creditHours 4, grade 100 → A (4.0)
    const sidB = `${ids.sid}_b` // creditHours 1, grade 60  → D (1.0)

    beforeAll(async () => {
      await insertFixtures(ids)
      const db = getDb()
      const now = new Date()
      await db.insert(subjects).values([
        {
          id: sidA,
          householdId: ids.hid,
          learnerId: ids.lid,
          name: 'Heavy Course',
          creditHours: '4',
          createdAt: now,
          updatedAt: now,
        },
        {
          id: sidB,
          householdId: ids.hid,
          learnerId: ids.lid,
          name: 'Light Course',
          creditHours: '1',
          createdAt: now,
          updatedAt: now,
        },
      ]).onConflictDoNothing()
    })
    afterAll(async () => {
      const db = getDb()
      await db.delete(scores).where(eq(scores.householdId, ids.hid))
      await db.delete(subjects).where(eq(subjects.householdId, ids.hid))
      await cleanupFixtures(ids)
    })

    it('weights GPA by stored creditHours, not a constant 1', async () => {
      await createScore(ids.hid, {
        learnerId: ids.lid, subjectId: sidA, state: 'graded',
        numericValue: 100, source: 'parent', occurredAt: new Date('2026-05-05').toISOString(),
      })
      await createScore(ids.hid, {
        learnerId: ids.lid, subjectId: sidB, state: 'graded',
        numericValue: 60, source: 'parent', occurredAt: new Date('2026-05-05').toISOString(),
      })

      const summaries = await listGradebookSummaries(ids.hid)
      const summary = summaries.find(s => s.learnerId === ids.lid)!

      // With real credit hours: (4.0*4 + 1.0*1) / 5 = 3.4
      // With the old hardcode of 1 for both: (4.0 + 1.0) / 2 = 2.5
      expect(summary.gpa.totalCreditHours).toBe(5)
      expect(summary.gpa.unweighted).toBeCloseTo(3.4, 2)

      const heavy = summary.subjects.find(s => s.subjectId === sidA)!
      expect(heavy.creditHours).toBe(4)
    }, DB_TIMEOUT_MS)
  })

  describe('updateScore + deleteScore (Phase 1)', () => {
    const ids = testIds('crud')

    beforeAll(async () => { await insertFixtures(ids) })
    afterAll(async () => { await cleanupFixtures(ids) })

    it('updateScore patches state/numericValue/comment and bumps the row', async () => {
      const created = await createScore(ids.hid, {
        learnerId: ids.lid, subjectId: ids.sid, state: 'graded',
        numericValue: 70, source: 'parent', occurredAt: new Date('2026-05-06').toISOString(),
      })

      const updated = await updateScore(created.id, ids.hid, {
        state: 'graded', numericValue: 95, comment: 'retake',
      })
      expect(updated).toBeDefined()

      const list = await listScores(ids.hid, ids.lid, ids.sid)
      const row = list.find(s => s.id === created.id)!
      expect(row.numericValue).toBe(95)
      expect(row.comment).toBe('retake')
    }, DB_TIMEOUT_MS)

    it('updateScore can clear numericValue when state becomes excused', async () => {
      const created = await createScore(ids.hid, {
        learnerId: ids.lid, subjectId: ids.sid, state: 'graded',
        numericValue: 80, source: 'parent', occurredAt: new Date('2026-05-07').toISOString(),
      })
      await updateScore(created.id, ids.hid, { state: 'excused', numericValue: null })
      const row = (await listScores(ids.hid, ids.lid, ids.sid)).find(s => s.id === created.id)!
      expect(row.state).toBe('excused')
      expect(row.numericValue).toBeNull()
    }, DB_TIMEOUT_MS)

    it('updateScore returns undefined for a foreign household', async () => {
      const created = await createScore(ids.hid, {
        learnerId: ids.lid, subjectId: ids.sid, state: 'graded',
        numericValue: 50, source: 'parent', occurredAt: new Date('2026-05-08').toISOString(),
      })
      const result = await updateScore(created.id, 'hh_does_not_exist', { numericValue: 99 })
      expect(result).toBeUndefined()
    }, DB_TIMEOUT_MS)

    it('deleteScore removes the row and returns true; false when already gone', async () => {
      const created = await createScore(ids.hid, {
        learnerId: ids.lid, subjectId: ids.sid, state: 'graded',
        numericValue: 88, source: 'parent', occurredAt: new Date('2026-05-09').toISOString(),
      })
      const ok = await deleteScore(created.id, ids.hid)
      expect(ok).toBe(true)
      const list = await listScores(ids.hid, ids.lid, ids.sid)
      expect(list.find(s => s.id === created.id)).toBeUndefined()

      const again = await deleteScore(created.id, ids.hid)
      expect(again).toBe(false)
    }, DB_TIMEOUT_MS)
  })

  // ─── Phase 6: grading scales + aggregation rules CRUD ─────────────────────────

  describe('grading scales CRUD', () => {
    const ids = testIds('gs')
    beforeAll(async () => { await insertFixtures(ids) })
    afterAll(async () => { await cleanupFixtures(ids) })

    it('create/list/update/delete grading scales', async () => {
      const scale = await createGradingScale(ids.hid, {
        name: 'Standard', bands: [{ minPercent: 90, letter: 'A', gpaPoints: 4 }, { minPercent: 0, letter: 'F', gpaPoints: 0 }],
      })
      expect(scale.id).toBeTruthy()
      expect((await listGradingScales(ids.hid)).find(s => s.id === scale.id)).toBeDefined()

      const updated = await updateGradingScale(scale.id, ids.hid, { name: 'Renamed' })
      expect(updated!.name).toBe('Renamed')
      expect(await updateGradingScale(scale.id, 'hh_nope', { name: 'x' })).toBeNull()

      expect(await deleteGradingScale(scale.id, ids.hid)).toBe(true)
      expect(await deleteGradingScale(scale.id, ids.hid)).toBe(false)
    }, DB_TIMEOUT_MS)
  })

  describe('aggregation rules CRUD', () => {
    const ids = testIds('ar')
    beforeAll(async () => { await insertFixtures(ids) })
    afterAll(async () => { await cleanupFixtures(ids) })

    it('create/list/update/delete aggregation rules', async () => {
      const rule = await createAggregationRule(ids.hid, { name: 'Latest', strategy: 'most_recent' })
      expect(rule.strategy).toBe('most_recent')
      expect((await listAggregationRules(ids.hid)).find(r => r.id === rule.id)).toBeDefined()

      const updated = await updateAggregationRule(rule.id, ids.hid, { strategy: 'highest' })
      expect(updated!.strategy).toBe('highest')

      expect(await deleteAggregationRule(rule.id, ids.hid)).toBe(true)
      expect(await deleteAggregationRule(rule.id, ids.hid)).toBe(false)
    }, DB_TIMEOUT_MS)
  })

  describe('listGradebookSummaries — honours per-subject scale + aggregation rule', () => {
    const ids = testIds('cfg')
    const sid = `${ids.sid}_cfg`

    beforeAll(async () => { await insertFixtures(ids) })
    afterAll(async () => { await cleanupFixtures(ids) })

    it('uses the highest-strategy rule and a custom scale for GPA', async () => {
      // Custom scale: ≥85 → 4 points, else 0. Rule: highest score wins.
      const scale = await createGradingScale(ids.hid, {
        name: 'Pass85', bands: [{ minPercent: 85, letter: 'P', gpaPoints: 4 }, { minPercent: 0, letter: 'N', gpaPoints: 0 }],
      })
      const rule = await createAggregationRule(ids.hid, { name: 'Best', strategy: 'highest' })

      const db = getDb()
      const now = new Date()
      await db.insert(subjects).values({
        id: sid, householdId: ids.hid, learnerId: ids.lid, name: 'Configured Course',
        creditHours: '2', gradingScaleId: scale.id, aggregationRuleId: rule.id,
        createdAt: now, updatedAt: now,
      }).onConflictDoNothing()

      // Two scores: 70 and 88. Average would be 79 (→ N/0 pts); highest is 88 (→ P/4 pts).
      await createScore(ids.hid, { learnerId: ids.lid, subjectId: sid, state: 'graded', numericValue: 70, source: 'parent', occurredAt: new Date('2026-05-01').toISOString() })
      await createScore(ids.hid, { learnerId: ids.lid, subjectId: sid, state: 'graded', numericValue: 88, source: 'parent', occurredAt: new Date('2026-05-02').toISOString() })

      const summaries = await listGradebookSummaries(ids.hid)
      const summary = summaries.find(s => s.learnerId === ids.lid)!
      const subjectResult = summary.subjects.find(s => s.subjectId === sid)!

      // Representative score = highest = 88 → letter P
      expect(subjectResult.pointsAverage).toBe(88)
      expect(subjectResult.gradeLetter).toBe('P')
      // GPA points = 4 (≥85 band), single graded subject → GPA 4.0
      expect(summary.gpa.weighted).toBeCloseTo(4.0, 5)
    }, DB_TIMEOUT_MS)
  })
})

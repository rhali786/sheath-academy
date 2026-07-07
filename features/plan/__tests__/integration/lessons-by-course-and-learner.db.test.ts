/** @jest-environment node */

/**
 * DB-backed integration test proving listLessonTaskRows correctly returns lessons
 * scoped to a specific (course, learner) pair — the query the Learning Time page's
 * Course + Learner selectors rely on. Runs only when DATABASE_URL is set.
 * Uses real getDb() — do NOT mock it.
 */

import { getDb, closeDb } from '@/features/lib/server/db'
import { users, households, learners, subjects, lessonTasks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { listLessonTaskRows } from '@/features/plan/server/repository'

const hasDb = !!process.env.DATABASE_URL
const describeDb = hasDb ? describe : describe.skip

const DB_TIMEOUT_MS = 15_000

afterAll(async () => {
  await closeDb()
})

describeDb('lessons filtered by course and learner (real DB)', () => {
  const RUN_ID = Date.now().toString(36)
  const uid = `user_dbtest_lcl_${RUN_ID}`
  const hid = `hh_dbtest_lcl_${RUN_ID}`
  const idrisId = `learner_dbtest_lcl_idris_${RUN_ID}`
  const haiaId = `learner_dbtest_lcl_haia_${RUN_ID}`
  const mathId = `subj_dbtest_lcl_math_${RUN_ID}`
  const readingId = `subj_dbtest_lcl_reading_${RUN_ID}`

  beforeAll(async () => {
    const db = getDb()
    const now = new Date()
    await db.insert(users).values({ id: uid, email: `${uid}@test.local`, name: 'Test User', createdAt: now, updatedAt: now })
    await db.insert(households).values({ id: hid, userId: uid, name: 'Test Household', createdAt: now, updatedAt: now })
    await db.insert(learners).values([
      { id: idrisId, householdId: hid, name: 'Idris', createdAt: now, updatedAt: now },
      { id: haiaId, householdId: hid, name: 'Haia', createdAt: now, updatedAt: now },
    ])
    await db.insert(subjects).values([
      { id: mathId, householdId: hid, learnerId: idrisId, name: 'Mathematics', createdAt: now, updatedAt: now },
      { id: readingId, householdId: hid, learnerId: haiaId, name: 'Reading', createdAt: now, updatedAt: now },
    ])
    await db.insert(lessonTasks).values([
      { id: `lt_dbtest_lcl_1_${RUN_ID}`, householdId: hid, learnerId: idrisId, subjectId: mathId, title: 'Idris Math lesson', status: 'not_started', dueDate: '2026-07-08', sortOrder: 0, createdAt: now, updatedAt: now },
      { id: `lt_dbtest_lcl_2_${RUN_ID}`, householdId: hid, learnerId: haiaId, subjectId: readingId, title: 'Haia Reading lesson', status: 'not_started', dueDate: '2026-07-08', sortOrder: 0, createdAt: now, updatedAt: now },
      { id: `lt_dbtest_lcl_3_${RUN_ID}`, householdId: hid, learnerId: idrisId, subjectId: null, title: 'Idris ad-hoc lesson', status: 'not_started', dueDate: '2026-07-08', sortOrder: 0, createdAt: now, updatedAt: now },
    ])
  }, DB_TIMEOUT_MS)

  afterAll(async () => {
    await getDb().delete(lessonTasks).where(eq(lessonTasks.householdId, hid))
    await getDb().delete(subjects).where(eq(subjects.householdId, hid))
    await getDb().delete(learners).where(eq(learners.householdId, hid))
    await getDb().delete(households).where(eq(households.id, hid))
    await getDb().delete(users).where(eq(users.id, uid))
  }, DB_TIMEOUT_MS)

  it(
    'filtering by learnerId + subjectId together returns only that pair\'s lesson — not other subjects or other learners',
    async () => {
      const rows = await listLessonTaskRows(hid, { learnerId: idrisId, subjectId: mathId })

      expect(rows).toHaveLength(1)
      expect(rows[0].title).toBe('Idris Math lesson')
    },
    DB_TIMEOUT_MS,
  )

  it(
    'a different learner enrolled in a different course only sees their own course\'s lesson',
    async () => {
      const rows = await listLessonTaskRows(hid, { learnerId: haiaId, subjectId: readingId })

      expect(rows).toHaveLength(1)
      expect(rows[0].title).toBe('Haia Reading lesson')
    },
    DB_TIMEOUT_MS,
  )

  it(
    'filtering by learnerId alone (no course selected) returns all of that learner\'s lessons across subjects',
    async () => {
      const rows = await listLessonTaskRows(hid, { learnerId: idrisId })

      const titles = rows.map(r => r.title).sort()
      expect(titles).toEqual(['Idris Math lesson', 'Idris ad-hoc lesson'])
    },
    DB_TIMEOUT_MS,
  )
})

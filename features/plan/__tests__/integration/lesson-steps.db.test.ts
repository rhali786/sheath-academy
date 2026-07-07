/** @jest-environment node */

/**
 * DB-backed integration tests for lesson_steps repository functions.
 * Runs only when DATABASE_URL is set (npm run test:db).
 * Tests use real getDb() — do NOT mock it.
 */

import { getDb, closeDb } from '@/features/lib/server/db'
import { users, households, learners, lessonTasks } from '@/db/schema'
import { eq } from 'drizzle-orm'
import {
  listLessonSteps,
  createLessonStep,
  updateLessonStep,
  deleteLessonStep,
} from '@/features/plan/server/repository'

const hasDb = !!process.env.DATABASE_URL
const describeDb = hasDb ? describe : describe.skip

const DB_TIMEOUT_MS = 15_000

afterAll(async () => {
  await closeDb()
})

// ─── Test fixtures ─────────────────────────────────────────────────────────────

function testIds(prefix: string) {
  const uid = `user_dbtest_ls_${prefix}`
  const hid = `hh_dbtest_ls_${prefix}`
  const lid = `learner_dbtest_ls_${prefix}`
  return { uid, hid, lid }
}

async function insertBaseFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  const now = new Date()
  await db
    .insert(users)
    .values({ id: ids.uid, email: `${ids.uid}@test.local`, name: 'Test User', createdAt: now, updatedAt: now })
    .onConflictDoNothing()
  await db
    .insert(households)
    .values({ id: ids.hid, userId: ids.uid, name: 'Test Household', createdAt: now, updatedAt: now })
    .onConflictDoNothing()
  await db
    .insert(learners)
    .values({ id: ids.lid, householdId: ids.hid, name: 'Test Learner', createdAt: now, updatedAt: now })
    .onConflictDoNothing()
}

async function insertTask(id: string, ids: ReturnType<typeof testIds>) {
  const db = getDb()
  const now = new Date()
  await db
    .insert(lessonTasks)
    .values({
      id,
      householdId: ids.hid,
      learnerId: ids.lid,
      subjectId: null,
      title: 'Test Task',
      status: 'not_started',
      sortOrder: 0,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
}

async function cleanupFixtures(ids: ReturnType<typeof testIds>) {
  const db = getDb()
  // lesson_steps rows are deleted via ON DELETE CASCADE when the task is deleted
  // lesson_tasks rows are deleted here; household FK cascades handle learners
  await db.delete(lessonTasks).where(eq(lessonTasks.learnerId, ids.lid))
  await db.delete(learners).where(eq(learners.id, ids.lid))
  await db.delete(households).where(eq(households.id, ids.hid))
  await db.delete(users).where(eq(users.id, ids.uid))
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describeDb('lesson_steps repository (real DB)', () => {
  const RUN_ID = Date.now().toString(36)
  let taskCounter = 0

  function makeTaskId() {
    return `task_dbtest_ls_${RUN_ID}_${++taskCounter}`
  }

  it(
    'createLessonStep + listLessonSteps round-trip',
    async () => {
      const ids = testIds(`rt_${RUN_ID}`)
      await insertBaseFixtures(ids)
      const taskId = makeTaskId()
      await insertTask(taskId, ids)

      try {
        const step = await createLessonStep({
          lessonTaskId: taskId,
          order: 1,
          stepText: 'Read pages 1-5',
          type: 'reading',
        })

        expect(step.lessonTaskId).toBe(taskId)
        expect(step.stepText).toBe('Read pages 1-5')
        expect(step.order).toBe(1)

        const steps = await listLessonSteps(taskId)
        expect(steps).toHaveLength(1)
        expect(steps[0].stepText).toBe('Read pages 1-5')
      } finally {
        await cleanupFixtures(ids)
      }
    },
    DB_TIMEOUT_MS,
  )

  it(
    'listLessonSteps is ordered by order column',
    async () => {
      const ids = testIds(`ord_${RUN_ID}`)
      await insertBaseFixtures(ids)
      const taskId = makeTaskId()
      await insertTask(taskId, ids)

      try {
        await createLessonStep({ lessonTaskId: taskId, order: 2, stepText: 'Step 2' })
        await createLessonStep({ lessonTaskId: taskId, order: 1, stepText: 'Step 1' })
        await createLessonStep({ lessonTaskId: taskId, order: 3, stepText: 'Step 3' })

        const steps = await listLessonSteps(taskId)
        expect(steps).toHaveLength(3)
        expect(steps.map((s) => s.order)).toEqual([1, 2, 3])
      } finally {
        await cleanupFixtures(ids)
      }
    },
    DB_TIMEOUT_MS,
  )

  it(
    'updateLessonStep changes stepText',
    async () => {
      const ids = testIds(`upd_${RUN_ID}`)
      await insertBaseFixtures(ids)
      const taskId = makeTaskId()
      await insertTask(taskId, ids)

      try {
        const step = await createLessonStep({ lessonTaskId: taskId, order: 1, stepText: 'Original' })
        const updated = await updateLessonStep(step.id, taskId, { stepText: 'Updated text' })

        expect(updated).not.toBeNull()
        expect(updated!.stepText).toBe('Updated text')

        const steps = await listLessonSteps(taskId)
        expect(steps[0].stepText).toBe('Updated text')
      } finally {
        await cleanupFixtures(ids)
      }
    },
    DB_TIMEOUT_MS,
  )

  it(
    'deleteLessonStep removes the row',
    async () => {
      const ids = testIds(`del_${RUN_ID}`)
      await insertBaseFixtures(ids)
      const taskId = makeTaskId()
      await insertTask(taskId, ids)

      try {
        const step = await createLessonStep({ lessonTaskId: taskId, order: 1, stepText: 'To delete' })
        const deleted = await deleteLessonStep(step.id, taskId)
        expect(deleted).toBe(true)

        const steps = await listLessonSteps(taskId)
        expect(steps).toHaveLength(0)
      } finally {
        await cleanupFixtures(ids)
      }
    },
    DB_TIMEOUT_MS,
  )
})

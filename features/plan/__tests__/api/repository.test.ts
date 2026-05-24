/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { createLessonTaskRow, listLessonTaskRows, updateLessonTaskRow, completeLessonTaskRow, deleteLessonTaskRow } from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('plan')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { lessonTasks } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(lessonTasks).where(eq(lessonTasks.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => { if (hasDb) await cleanup?.() })

describe('lesson tasks repository', () => {
  let taskId: string

  itDb('createLessonTaskRow inserts a row', async () => {
    const row = await createLessonTaskRow(householdId, {
      learnerId,
      title: 'Read Chapter 1',
      dueDate: '2026-06-01',
    })
    taskId = row.id
    expect(row.id).toBeTruthy()
    expect(row.status).toBe('not_started')
    expect(row.householdId).toBe(householdId)
  })

  itDb('listLessonTaskRows returns tasks for household', async () => {
    const rows = await listLessonTaskRows(householdId)
    expect(rows.some(r => r.id === taskId)).toBe(true)
  })

  itDb('listLessonTaskRows filters by learnerId', async () => {
    const rows = await listLessonTaskRows(householdId, { learnerId })
    expect(rows.every(r => r.learnerId === learnerId)).toBe(true)
  })

  itDb('updateLessonTaskRow changes the title', async () => {
    const updated = await updateLessonTaskRow(taskId, householdId, { title: 'Read Chapter 2' })
    expect(updated?.title).toBe('Read Chapter 2')
  })

  itDb('completeLessonTaskRow sets status = completed', async () => {
    const done = await completeLessonTaskRow(taskId, householdId, 'completed')
    expect(done?.status).toBe('completed')
  })

  itDb('deleteLessonTaskRow removes the row', async () => {
    const deleted = await deleteLessonTaskRow(taskId, householdId)
    expect(deleted).toBe(true)
    const rows = await listLessonTaskRows(householdId)
    expect(rows.some(r => r.id === taskId)).toBe(false)
  })
})

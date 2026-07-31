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

  itDb('createLessonTaskRow round-trips resourceLink/lessonType/estimatedDuration', async () => {
    const row = await createLessonTaskRow(householdId, {
      learnerId,
      title: 'Watch video',
      dueDate: '2026-06-02',
      resourceLink: 'https://example.com/video',
      lessonType: 'Video',
      estimatedDuration: '30min',
    })
    expect(row.resourceLink).toBe('https://example.com/video')
    expect(row.lessonType).toBe('Video')
    expect(row.estimatedDuration).toBe('30min')

    const updated = await updateLessonTaskRow(row.id, householdId, {
      resourceLink: 'https://example.com/updated',
      lessonType: 'Reading',
      estimatedDuration: '1hr',
    })
    expect(updated?.resourceLink).toBe('https://example.com/updated')
    expect(updated?.lessonType).toBe('Reading')
    expect(updated?.estimatedDuration).toBe('1hr')

    await deleteLessonTaskRow(row.id, householdId)
  })

  itDb('createLessonTaskRow round-trips curriculum/chapter/hasHomework/hasAssessment', async () => {
    const row = await createLessonTaskRow(householdId, {
      learnerId,
      title: 'Read Chapter 91',
      dueDate: '2026-06-03',
      curriculum: 'All About Reading Level 2',
      chapter: 'Chapter 91',
      hasHomework: true,
      hasAssessment: false,
    })
    expect(row.curriculum).toBe('All About Reading Level 2')
    expect(row.chapter).toBe('Chapter 91')
    expect(row.hasHomework).toBe(true)
    expect(row.hasAssessment).toBe(false)

    const updated = await updateLessonTaskRow(row.id, householdId, {
      curriculum: 'Saxon Math 5/4',
      chapter: 'Lesson 12',
      hasHomework: false,
      hasAssessment: true,
    })
    expect(updated?.curriculum).toBe('Saxon Math 5/4')
    expect(updated?.chapter).toBe('Lesson 12')
    expect(updated?.hasHomework).toBe(false)
    expect(updated?.hasAssessment).toBe(true)

    await deleteLessonTaskRow(row.id, householdId)
  })

  itDb('createLessonTaskRow omits curriculum/chapter/homework/assessment cleanly when not provided', async () => {
    const row = await createLessonTaskRow(householdId, {
      learnerId,
      title: 'Plain lesson, no teaching metadata',
      dueDate: '2026-06-04',
    })
    expect(row.curriculum).toBeNull()
    expect(row.chapter).toBeNull()
    expect(row.hasHomework).toBe(false)
    expect(row.hasAssessment).toBe(false)

    await deleteLessonTaskRow(row.id, householdId)
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

  itDb('createLessonTaskRow round-trips plannedStartDate', async () => {
    const row = await createLessonTaskRow(householdId, {
      learnerId,
      title: 'Window lesson',
      plannedStartDate: '2026-06-05',
      dueDate: '2026-06-10',
    })
    expect(row.plannedStartDate).toBe('2026-06-05')
    expect(row.dueDate).toBe('2026-06-10')

    const updated = await updateLessonTaskRow(row.id, householdId, { plannedStartDate: '2026-06-06' })
    expect(updated?.plannedStartDate).toBe('2026-06-06')

    await deleteLessonTaskRow(row.id, householdId)
  })

  itDb('listLessonTaskRows matches completion-window overlap, not dueDate alone', async () => {
    const windowRow = await createLessonTaskRow(householdId, {
      learnerId,
      title: 'Spanning lesson',
      plannedStartDate: '2026-06-05',
      dueDate: '2026-06-15',
    })
    const legacyRow = await createLessonTaskRow(householdId, {
      learnerId,
      title: 'Legacy lesson',
      dueDate: '2026-06-20',
    })

    const midWeek = await listLessonTaskRows(householdId, { startDate: '2026-06-08', endDate: '2026-06-12' })
    expect(midWeek.some(r => r.id === windowRow.id)).toBe(true)
    expect(midWeek.some(r => r.id === legacyRow.id)).toBe(false)

    const legacyOnly = await listLessonTaskRows(householdId, { startDate: '2026-06-18', endDate: '2026-06-22' })
    expect(legacyOnly.some(r => r.id === windowRow.id)).toBe(false)
    expect(legacyOnly.some(r => r.id === legacyRow.id)).toBe(true)

    const beforeWindow = await listLessonTaskRows(householdId, { startDate: '2026-06-01', endDate: '2026-06-04' })
    expect(beforeWindow.some(r => r.id === windowRow.id)).toBe(false)

    await deleteLessonTaskRow(windowRow.id, householdId)
    await deleteLessonTaskRow(legacyRow.id, householdId)
  })

  itDb('createLessonTasksFanOut inserts one row per learner with shared group_id', async () => {
    const { createLearner } = await import('@/features/children/server/repository')
    const learner2 = await createLearner(householdId, { name: 'Learner Two' })
    const learner3 = await createLearner(householdId, { name: 'Learner Three' })

    const { createLessonTasksFanOut } = await import('../../server/repository')
    const rows = await createLessonTasksFanOut(
      householdId,
      { title: 'Group lesson', dueDate: '2026-06-20' },
      [
        { learnerId, subjectId: undefined },
        { learnerId: learner2.id },
        { learnerId: learner3.id },
      ],
    )

    expect(rows).toHaveLength(3)
    expect(rows.every(r => r.groupId === rows[0].groupId)).toBe(true)
    expect(rows[0].groupId).toBeTruthy()
    expect(new Set(rows.map(r => r.learnerId)).size).toBe(3)
    expect(rows.every(r => r.status === 'not_started')).toBe(true)

    const { updateLessonTaskRow, deleteLessonTaskRow: deleteRow } = await import('../../server/repository')
    await updateLessonTaskRow(rows[0].id, householdId, { title: 'Updated group title' }, { applyToGroup: true })
    const afterUpdate = await listLessonTaskRows(householdId)
    const groupRows = afterUpdate.filter(r => r.groupId === rows[0].groupId)
    expect(groupRows.every(r => r.title === 'Updated group title')).toBe(true)

    await completeLessonTaskRow(rows[1].id, householdId, 'completed')
    const afterComplete = await listLessonTaskRows(householdId)
    const completedRow = afterComplete.find(r => r.id === rows[1].id)
    const pendingRow = afterComplete.find(r => r.id === rows[2].id)
    expect(completedRow?.status).toBe('completed')
    expect(pendingRow?.status).toBe('not_started')

    await deleteRow(rows[0].id, householdId, { deleteGroup: true })
    const afterDelete = await listLessonTaskRows(householdId)
    expect(afterDelete.some(r => r.groupId === rows[0].groupId)).toBe(false)
  })

  itDb('createLessonTasksFanOut with one learner leaves group_id NULL', async () => {
    const { createLessonTasksFanOut } = await import('../../server/repository')
    const rows = await createLessonTasksFanOut(
      householdId,
      { title: 'Solo lesson', dueDate: '2026-06-21' },
      [{ learnerId }],
    )
    expect(rows).toHaveLength(1)
    expect(rows[0].groupId).toBeNull()
    await deleteLessonTaskRow(rows[0].id, householdId)
  })
})

/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  archiveSubjectsByLearner,
  createSubjectRow,
  listSubjectRows,
  updateSubjectRow,
  archiveSubjectRow,
  getSubjectRow,
} from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('subjects')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects, subjectLearners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(subjectLearners).where(
      eq(subjectLearners.subjectId, householdId)  // cleaned via subject cascade
    )
    await getDb().delete(subjects).where(eq(subjects.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => { if (hasDb) await cleanup?.() })

describe('subjects repository', () => {
  let subjectId: string

  itDb('createSubjectRow inserts a row', async () => {
    const row = await createSubjectRow(householdId, { name: 'Mathematics', category: 'core', learnerId })
    subjectId = row.id
    expect(row.id).toBeTruthy()
    expect(row.householdId).toBe(householdId)
    expect(row.name).toBe('Mathematics')
    expect(row.isActive).toBe(true)
  })

  itDb('listSubjectRows returns active subjects for household', async () => {
    const rows = await listSubjectRows(householdId)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(r => r.householdId === householdId)).toBe(true)
  })

  itDb('listSubjectRows filters by learnerId', async () => {
    const rows = await listSubjectRows(householdId, learnerId)
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every(r => r.learnerId === learnerId)).toBe(true)
  })

  itDb('updateSubjectRow updates the name', async () => {
    const updated = await updateSubjectRow(subjectId, householdId, { name: 'Advanced Math' })
    expect(updated?.name).toBe('Advanced Math')
  })

  itDb('archiveSubjectRow sets isActive = false', async () => {
    const archived = await archiveSubjectRow(subjectId, householdId)
    expect(archived?.isActive).toBe(false)
  })
})

describe('subjects repository — multi-learner via subject_learners join table', () => {
  itDb('createSubjectRow with learnerIds persists all learners and round-trips via listSubjectRows', async () => {
    const { createLearner } = await import('@/features/children/server/repository')
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects: subjectsTable, subjectLearners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const l2 = await createLearner(householdId, { name: 'Learner Two' })
    const l3 = await createLearner(householdId, { name: 'Learner Three' })
    let subjectId = ''
    try {
      const row = await createSubjectRow(householdId, {
        name: 'Shared Science',
        category: 'Science',
        learnerIds: [learnerId, l2.id, l3.id],
      })
      subjectId = row.id

      // learnerIds[] must contain all 3
      expect(row.learnerIds).toHaveLength(3)
      expect(row.learnerIds).toContain(learnerId)
      expect(row.learnerIds).toContain(l2.id)
      expect(row.learnerIds).toContain(l3.id)

      // back-compat: subjects.learnerId === learnerIds[0] (primary)
      expect(row.learnerId).toBe(learnerId)

      // listSubjectRows also returns all 3
      const listed = await listSubjectRows(householdId)
      const found = listed.find(r => r.id === subjectId)
      expect(found).toBeDefined()
      expect(found!.learnerIds).toHaveLength(3)
    } finally {
      if (subjectId) {
        await getDb().delete(subjectLearners).where(eq(subjectLearners.subjectId, subjectId))
        await getDb().delete(subjectsTable).where(eq(subjectsTable.id, subjectId))
      }
      const { learners: learnersTable } = await import('@/db/schema')
      await getDb().delete(learnersTable).where(eq(learnersTable.id, l2.id))
      await getDb().delete(learnersTable).where(eq(learnersTable.id, l3.id))
    }
  })

  itDb('single-learner course (learnerId only) back-compat — learnerIds has exactly 1 element', async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects: subjectsTable, subjectLearners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    let subjectId = ''
    try {
      const row = await createSubjectRow(householdId, {
        name: 'Solo Math',
        category: 'Math',
        learnerId,
      })
      subjectId = row.id
      expect(row.learnerIds).toHaveLength(1)
      expect(row.learnerIds[0]).toBe(learnerId)
      expect(row.learnerId).toBe(learnerId)
    } finally {
      if (subjectId) {
        await getDb().delete(subjectLearners).where(eq(subjectLearners.subjectId, subjectId))
        await getDb().delete(subjectsTable).where(eq(subjectsTable.id, subjectId))
      }
    }
  })

  itDb('updateSubjectRow with learnerIds syncs subject_learners enrollment', async () => {
    const { createLearner } = await import('@/features/children/server/repository')
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects: subjectsTable, subjectLearners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const l2 = await createLearner(householdId, { name: 'Edit Learner Two' })
    let subjectId = ''
    try {
      const created = await createSubjectRow(householdId, {
        name: 'Editable Solo',
        category: 'Math',
        learnerId,
      })
      subjectId = created.id
      expect(created.learnerIds).toEqual([learnerId])

      const updated = await updateSubjectRow(subjectId, householdId, {
        learnerIds: [learnerId, l2.id],
      })
      expect(updated?.learnerIds).toHaveLength(2)
      expect(updated?.learnerIds).toContain(learnerId)
      expect(updated?.learnerIds).toContain(l2.id)
      expect(updated?.learnerId).toBe(learnerId)

      const listed = await listSubjectRows(householdId)
      const found = listed.find((r) => r.id === subjectId)
      expect(found?.learnerIds).toHaveLength(2)
    } finally {
      if (subjectId) {
        await getDb().delete(subjectLearners).where(eq(subjectLearners.subjectId, subjectId))
        await getDb().delete(subjectsTable).where(eq(subjectsTable.id, subjectId))
      }
      const { learners: learnersTable } = await import('@/db/schema')
      await getDb().delete(learnersTable).where(eq(learnersTable.id, l2.id))
    }
  })
})

describe('subjects repository — listSubjectRows enrollment-based filtering (secondary learners)', () => {
  itDb('listSubjectRows(householdId, secondaryLearnerId) returns a course where the learner is a secondary (non-primary) enrollee', async () => {
    const { createLearner } = await import('@/features/children/server/repository')
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects: subjectsTable, subjectLearners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const secondary = await createLearner(householdId, { name: 'Secondary Learner' })
    let subjectId = ''
    try {
      const row = await createSubjectRow(householdId, {
        name: 'Group Science',
        category: 'Science',
        learnerIds: [learnerId, secondary.id],
      })
      subjectId = row.id
      // primary column only holds the first learner
      expect(row.learnerId).toBe(learnerId)

      const rowsForSecondary = await listSubjectRows(householdId, secondary.id)
      const found = rowsForSecondary.find((r) => r.id === subjectId)
      expect(found).toBeDefined()
      expect(found?.learnerIds).toContain(secondary.id)
    } finally {
      if (subjectId) {
        await getDb().delete(subjectLearners).where(eq(subjectLearners.subjectId, subjectId))
        await getDb().delete(subjectsTable).where(eq(subjectsTable.id, subjectId))
      }
      const { learners: learnersTable } = await import('@/db/schema')
      await getDb().delete(learnersTable).where(eq(learnersTable.id, secondary.id))
    }
  })
})

describe('subjects repository — resourceIds via subject_resources join table', () => {
  itDb('createSubjectRow returns resourceIds: [] and updateSubjectRow with resourceIds persists link rows', async () => {
    const { createResourceRow } = await import('@/features/resources/server/repository')
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects: subjectsTable, subjectLearners, subjectResources, resources: resourcesTable } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const r1 = await createResourceRow(householdId, { title: 'Resource One', resourceType: 'textbook' })
    const r2 = await createResourceRow(householdId, { title: 'Resource Two', resourceType: 'workbook' })

    let subjectId = ''
    try {
      const created = await createSubjectRow(householdId, {
        name: 'Resourceful Course',
        category: 'Science',
        learnerId,
      })
      subjectId = created.id
      expect(created.resourceIds).toEqual([])

      const updated = await updateSubjectRow(subjectId, householdId, {
        resourceIds: [r1.id, r2.id],
      })
      expect(updated?.resourceIds).toHaveLength(2)
      expect(updated?.resourceIds).toContain(r1.id)
      expect(updated?.resourceIds).toContain(r2.id)

      // getSubjectRow round-trips resourceIds
      const fetched = await getSubjectRow(subjectId, householdId)
      expect(fetched?.resourceIds).toHaveLength(2)
      expect(fetched?.resourceIds).toContain(r1.id)
      expect(fetched?.resourceIds).toContain(r2.id)

      // listSubjectRows round-trips resourceIds
      const listed = await listSubjectRows(householdId)
      const found = listed.find((r) => r.id === subjectId)
      expect(found?.resourceIds).toHaveLength(2)
      expect(found?.resourceIds).toContain(r1.id)
      expect(found?.resourceIds).toContain(r2.id)

      // updateSubjectRow with resourceIds replaces the link set exactly
      const replaced = await updateSubjectRow(subjectId, householdId, {
        resourceIds: [r1.id],
      })
      expect(replaced?.resourceIds).toEqual([r1.id])
    } finally {
      if (subjectId) {
        await getDb().delete(subjectResources).where(eq(subjectResources.subjectId, subjectId))
        await getDb().delete(subjectLearners).where(eq(subjectLearners.subjectId, subjectId))
        await getDb().delete(subjectsTable).where(eq(subjectsTable.id, subjectId))
      }
      await getDb().delete(resourcesTable).where(eq(resourcesTable.id, r1.id))
      await getDb().delete(resourcesTable).where(eq(resourcesTable.id, r2.id))
    }
  })
})

describe('archiveSubjectsByLearner', () => {
  itDb('removes archived learner from group course but keeps course active for others', async () => {
    const { createLearner } = await import('@/features/children/server/repository')
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects: subjectsTable, subjectLearners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const safiya = await createLearner(householdId, { name: 'Safiya' })
    let subjectId = ''
    try {
      const row = await createSubjectRow(householdId, {
        name: 'Algebra',
        category: 'Math',
        learnerIds: [learnerId, safiya.id],
      })
      subjectId = row.id

      await archiveSubjectsByLearner(safiya.id, householdId)

      const listed = await listSubjectRows(householdId)
      const found = listed.find((r) => r.id === subjectId)
      expect(found).toBeDefined()
      expect(found!.isActive).toBe(true)
      expect(found!.learnerIds).toEqual([learnerId])
      expect(found!.learnerId).toBe(learnerId)
    } finally {
      if (subjectId) {
        await getDb().delete(subjectLearners).where(eq(subjectLearners.subjectId, subjectId))
        await getDb().delete(subjectsTable).where(eq(subjectsTable.id, subjectId))
      }
      const { learners: learnersTable } = await import('@/db/schema')
      await getDb().delete(learnersTable).where(eq(learnersTable.id, safiya.id))
    }
  })

  itDb('archives solo course owned only by the archived learner', async () => {
    const { createLearner } = await import('@/features/children/server/repository')
    const { getDb } = await import('@/features/lib/server/db')
    const { subjects: subjectsTable, subjectLearners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')

    const safiya = await createLearner(householdId, { name: 'Safiya Solo' })
    let subjectId = ''
    try {
      const row = await createSubjectRow(householdId, {
        name: 'Safiya Reading',
        category: 'Reading',
        learnerIds: [safiya.id],
      })
      subjectId = row.id

      await archiveSubjectsByLearner(safiya.id, householdId)

      const listed = await listSubjectRows(householdId, undefined, true)
      const found = listed.find((r) => r.id === subjectId)
      expect(found?.isActive).toBe(false)
      expect(found?.learnerIds).toEqual([])
    } finally {
      if (subjectId) {
        await getDb().delete(subjectLearners).where(eq(subjectLearners.subjectId, subjectId))
        await getDb().delete(subjectsTable).where(eq(subjectsTable.id, subjectId))
      }
      const { learners: learnersTable } = await import('@/db/schema')
      await getDb().delete(learnersTable).where(eq(learnersTable.id, safiya.id))
    }
  })
})

/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { createSubjectRow, listSubjectRows, updateSubjectRow, archiveSubjectRow } from '../../server/repository'
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
    const { subjects } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
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

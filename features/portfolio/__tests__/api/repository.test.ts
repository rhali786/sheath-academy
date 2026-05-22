/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { createEvidenceRow, listEvidenceRows, deleteEvidenceRow } from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('portfolio')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { portfolioEvidence } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(portfolioEvidence).where(eq(portfolioEvidence.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => { if (hasDb) await cleanup?.() })

describe('portfolio evidence repository', () => {
  let evidenceId: string

  itDb('createEvidenceRow inserts a row', async () => {
    const row = await createEvidenceRow(householdId, {
      learnerId,
      title: 'Math worksheet',
      evidenceType: 'work_sample',
      evidenceDate: '2026-06-10',
    })
    evidenceId = row.id
    expect(row.id).toBeTruthy()
    expect(row.title).toBe('Math worksheet')
    expect(row.householdId).toBe(householdId)
  })

  itDb('listEvidenceRows returns items for household', async () => {
    const rows = await listEvidenceRows(householdId)
    expect(rows.some(r => r.id === evidenceId)).toBe(true)
  })

  itDb('listEvidenceRows filters by learnerId', async () => {
    const rows = await listEvidenceRows(householdId, { learnerId })
    expect(rows.every(r => r.learnerId === learnerId)).toBe(true)
  })

  itDb('deleteEvidenceRow removes the row', async () => {
    const deleted = await deleteEvidenceRow(evidenceId, householdId)
    expect(deleted).toBe(true)
  })
})

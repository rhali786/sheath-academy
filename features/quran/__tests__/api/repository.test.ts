/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { createQuranSessionRow, listQuranSessionRows, deleteQuranSessionRow } from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('quran')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { quranSessions } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(quranSessions).where(eq(quranSessions.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => { if (hasDb) await cleanup?.() })

describe('quran sessions repository', () => {
  let sessionId: string

  itDb('createQuranSessionRow inserts a row', async () => {
    const row = await createQuranSessionRow(householdId, {
      learnerId,
      sessionDate: '2026-06-10',
      sessionType: 'memorization',
      surah: 'Al-Baqarah',
      fromAyah: 1,
      toAyah: 5,
    })
    sessionId = row.id
    expect(row.id).toBeTruthy()
    expect(row.sessionType).toBe('memorization')
    expect(row.householdId).toBe(householdId)
  })

  itDb('listQuranSessionRows returns sessions for household', async () => {
    const rows = await listQuranSessionRows(householdId)
    expect(rows.some(r => r.id === sessionId)).toBe(true)
  })

  itDb('listQuranSessionRows filters by learnerId', async () => {
    const rows = await listQuranSessionRows(householdId, { learnerId })
    expect(rows.every(r => r.learnerId === learnerId)).toBe(true)
  })

  itDb('deleteQuranSessionRow removes the row', async () => {
    const deleted = await deleteQuranSessionRow(sessionId, householdId)
    expect(deleted).toBe(true)
  })
})

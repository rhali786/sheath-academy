/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  createSessionRow,
  getActiveSessionRow,
  getSessionRow,
  listFinalizedSessionRows,
  updateSessionRow,
} from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('learning-time')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { learningTimeSessions } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(learningTimeSessions).where(eq(learningTimeSessions.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => {
  if (hasDb) await cleanup?.()
})

describe('learning-time repository', () => {
  let sessionId: string

  itDb('createSessionRow inserts a draft session', async () => {
    const row = await createSessionRow(householdId, {
      learnerId,
      timeChannelType: 'stopwatch',
    })
    sessionId = row.id
    expect(row.id).toBeTruthy()
    expect(row.householdId).toBe(householdId)
    expect(row.learnerId).toBe(learnerId)
    expect(row.timeChannelType).toBe('stopwatch')
    expect(row.status).toBe('draft')
    expect(row.startedAt).toBeNull()
  })

  itDb('getSessionRow returns the created row', async () => {
    const row = await getSessionRow(sessionId, householdId)
    expect(row?.id).toBe(sessionId)
  })

  itDb('getActiveSessionRow returns the non-finalized session for the learner', async () => {
    const row = await getActiveSessionRow(householdId, learnerId)
    expect(row?.id).toBe(sessionId)
  })

  itDb('createSessionRow rejects a second active session for the same learner', async () => {
    await expect(
      createSessionRow(householdId, { learnerId, timeChannelType: 'timer', targetMinutes: 20 }),
    ).rejects.toThrow(/active learning time session/i)
  })

  itDb('updateSessionRow updates status and startedAt', async () => {
    const startedAt = new Date()
    const updated = await updateSessionRow(sessionId, householdId, {
      status: 'running',
      startedAt,
    })
    expect(updated?.status).toBe('running')
    expect(updated?.startedAt?.getTime()).toBe(startedAt.getTime())
  })

  itDb('finalizing the session frees the learner for a new active session', async () => {
    await updateSessionRow(sessionId, householdId, {
      status: 'finalized',
      endedAt: new Date(),
      endedBy: 'manual',
      outcome: 'complete',
    })
    const active = await getActiveSessionRow(householdId, learnerId)
    expect(active).toBeNull()

    const row = await createSessionRow(householdId, { learnerId, timeChannelType: 'stopwatch' })
    expect(row.id).not.toBe(sessionId)
  })

  itDb('listFinalizedSessionRows includes a session that ended later the same day as `to`', async () => {
    // Regression: `to` is a date-only string; the query must treat it as end-of-day, not
    // midnight UTC, or same-day sessions ending after midnight UTC get excluded.
    const draft = await createSessionRow(householdId, { learnerId, timeChannelType: 'stopwatch' })
    const lateInDay = new Date()
    lateInDay.setUTCHours(23, 30, 0, 0)
    await updateSessionRow(draft.id, householdId, {
      status: 'finalized',
      endedAt: lateInDay,
      endedBy: 'manual',
      outcome: 'complete',
    })

    const todayStr = `${lateInDay.getUTCFullYear()}-${String(lateInDay.getUTCMonth() + 1).padStart(2, '0')}-${String(lateInDay.getUTCDate()).padStart(2, '0')}`
    const rows = await listFinalizedSessionRows(householdId, { from: todayStr, to: todayStr })
    expect(rows.some(r => r.id === draft.id)).toBe(true)
  })
})

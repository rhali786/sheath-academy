/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import { createAttendanceEvent, listAttendanceEvents, voidAttendanceEvent } from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

const testDate = '2026-06-15'
let householdId: string
let learnerId: string
let cleanup: () => Promise<void>

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('attendance')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id
  cleanup = async () => {
    const { getDb } = await import('@/features/lib/server/db')
    const { attendanceEvents } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    await getDb().delete(attendanceEvents).where(eq(attendanceEvents.householdId, householdId))
    await fixtures.cleanup()
  }
})

afterAll(async () => { if (hasDb) await cleanup?.() })

describe('attendance events repository', () => {
  let eventId1: string
  let eventId2: string

  itDb('createAttendanceEvent inserts a row', async () => {
    const row = await createAttendanceEvent(householdId, { learnerId, attendanceDate: testDate, status: 'present', minutes: 360 })
    eventId1 = row.id
    expect(row.id).toBeTruthy()
    expect(row.status).toBe('present')
    expect(row.voidedAt).toBeNull()
  })

  itDb('allows multiple events per learner per day (multi-event model)', async () => {
    const row = await createAttendanceEvent(householdId, { learnerId, attendanceDate: testDate, status: 'partial', minutes: 120 })
    eventId2 = row.id
    const rows = await listAttendanceEvents(householdId, { learnerId, date: testDate })
    expect(rows.length).toBe(2)
  })

  itDb('listAttendanceEvents excludes voided events by default', async () => {
    await voidAttendanceEvent(eventId1, householdId)
    const rows = await listAttendanceEvents(householdId, { learnerId, date: testDate })
    expect(rows.find(r => r.id === eventId1)).toBeUndefined()
    expect(rows.find(r => r.id === eventId2)).toBeDefined()
  })

  itDb('listAttendanceEvents includes voided when includeVoided=true', async () => {
    const rows = await listAttendanceEvents(householdId, { learnerId, date: testDate, includeVoided: true })
    expect(rows.length).toBe(2)
  })
})

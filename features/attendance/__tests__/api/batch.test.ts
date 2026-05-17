/** @jest-environment node */

import { POST as BATCH_POST } from '@/features/attendance/api/routes/batch'
import { resetStore } from '@/features/attendance/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

function makeBatchRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/attendance/batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/attendance/batch', () => {
  it('creates one record per entry in the batch', async () => {
    const res = await BATCH_POST(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
      status: 'present',
      childIds: [SEED_IDS.layth, SEED_IDS.hawa],
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.status).toBe('success')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].status).toBe('present')
    expect(body.data[0].date).toBe('2026-06-10')
  })

  it('passes hours, minutes, notes to each record', async () => {
    const res = await BATCH_POST(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-11',
      status: 'partial',
      childIds: [SEED_IDS.layth],
      hours: 3,
      minutes: 30,
      notes: 'Short day',
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data[0].hours).toBe(3)
    expect(body.data[0].minutes).toBe(30)
    expect(body.data[0].notes).toBe('Short day')
  })

  it('returns 400 when childIds is missing or empty', async () => {
    const res = await BATCH_POST(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
      status: 'present',
      childIds: [],
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns 400 when date is missing', async () => {
    const res = await BATCH_POST(makeBatchRequest({
      householdId: SEED_IDS.household,
      status: 'present',
      childIds: [SEED_IDS.layth],
    }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when status is invalid', async () => {
    const res = await BATCH_POST(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
      status: 'unknown',
      childIds: [SEED_IDS.layth],
    }))
    expect(res.status).toBe(400)
  })

  it('skips unknown childIds and still creates records for valid ones', async () => {
    const res = await BATCH_POST(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
      status: 'present',
      childIds: [SEED_IDS.layth, 'unknown_child_999'],
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    // Only the valid child should have a record created
    expect(body.data).toHaveLength(1)
    expect(body.data[0].childId).toBe(SEED_IDS.layth)
  })
})

/** @jest-environment node */

import { BATCH } from '@/features/attendance/api/routes/attendance'
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

describe('BATCH /api/attendance/batch', () => {
  it('creates one record per entry in the batch', async () => {
    const res = await BATCH(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
      entries: [
        { childId: SEED_IDS.layth, status: 'present' },
        { childId: SEED_IDS.hawa, status: 'present' },
      ],
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.status).toBe('success')
    expect(Array.isArray(body.data)).toBe(true)
    expect(body.data).toHaveLength(2)
    expect(body.data[0].status).toBe('present')
    expect(body.data[0].date).toBe('2026-06-10')
  })

  it('creates records with different statuses per entry', async () => {
    const res = await BATCH(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-11',
      entries: [
        { childId: SEED_IDS.layth, status: 'present' },
        { childId: SEED_IDS.hawa, status: 'absent' },
      ],
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data).toHaveLength(2)
    const statuses = body.data.map((r: { status: string }) => r.status)
    expect(statuses).toContain('present')
    expect(statuses).toContain('absent')
  })

  it('returns 400 when entries is missing or not an array', async () => {
    const res = await BATCH(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
    }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns 400 when date is missing', async () => {
    const res = await BATCH(makeBatchRequest({
      householdId: SEED_IDS.household,
      entries: [{ childId: SEED_IDS.layth, status: 'present' }],
    }))
    expect(res.status).toBe(400)
  })

  it('skips entries with invalid status and still creates records for valid ones', async () => {
    const res = await BATCH(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
      entries: [
        { childId: SEED_IDS.layth, status: 'present' },
        { childId: SEED_IDS.hawa, status: 'not_a_real_status' },
      ],
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    // Only valid entries get records
    expect(body.data).toHaveLength(1)
    expect(body.data[0].childId).toBe(SEED_IDS.layth)
  })

  it('skips entries with unknown childIds and still creates records for valid ones', async () => {
    const res = await BATCH(makeBatchRequest({
      householdId: SEED_IDS.household,
      date: '2026-06-10',
      entries: [
        { childId: SEED_IDS.layth, status: 'present' },
        { childId: 'unknown_child_999', status: 'present' },
      ],
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data).toHaveLength(1)
    expect(body.data[0].childId).toBe(SEED_IDS.layth)
  })
})

/** @jest-environment node */

import { GET, POST } from '@/features/attendance/api/routes/attendance'
import { resetStore } from '@/features/attendance/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

function makeGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/attendance')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString())
}

function makePostRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/attendance', () => {
  it('returns seed records', async () => {
    const res = await GET(makeGetRequest())
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.length).toBeGreaterThan(0)
  })

  it('filters by childId', async () => {
    const res = await GET(makeGetRequest({ childId: SEED_IDS.adam }))
    const body = await res.json()
    expect(body.status).toBe('success')
    body.data.forEach((r: { childId: string }) => {
      expect(r.childId).toBe(SEED_IDS.adam)
    })
  })

  it('filters by exact date', async () => {
    const res = await GET(makeGetRequest({ date: '2000-01-01' }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('filters by startDate/endDate range', async () => {
    const res = await GET(makeGetRequest({ startDate: '2000-01-01', endDate: '2000-12-31' }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })
})

describe('POST /api/attendance', () => {
  it('creates a record with required fields', async () => {
    const res = await POST(makePostRequest({
      childId: SEED_IDS.adam,
      householdId: SEED_IDS.household,
      date: '2026-06-01',
      status: 'present',
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.status).toBe('success')
    expect(body.data.childId).toBe(SEED_IDS.adam)
    expect(body.data.status).toBe('present')
    expect(body.data.date).toBe('2026-06-01')
    expect(body.data.id).toBeDefined()
  })

  it('creates a record with optional hours and notes', async () => {
    const res = await POST(makePostRequest({
      childId: SEED_IDS.khadijah,
      householdId: SEED_IDS.household,
      date: '2026-06-02',
      status: 'partial',
      hours: 3,
      minutes: 30,
      notes: 'Half day due to appointment',
    }))
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.data.hours).toBe(3)
    expect(body.data.minutes).toBe(30)
    expect(body.data.notes).toBe('Half day due to appointment')
  })

  it('returns 400 when required fields are missing', async () => {
    const res = await POST(makePostRequest({ childId: SEED_IDS.adam }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns 400 for invalid status', async () => {
    const res = await POST(makePostRequest({
      childId: SEED_IDS.adam,
      householdId: SEED_IDS.household,
      date: '2026-06-01',
      status: 'invalid_status',
    }))
    expect(res.status).toBe(400)
  })

  it('returns 404 for unknown childId', async () => {
    const res = await POST(makePostRequest({
      childId: 'nonexistent_child',
      householdId: SEED_IDS.household,
      date: '2026-06-01',
      status: 'present',
    }))
    expect(res.status).toBe(404)
  })
})

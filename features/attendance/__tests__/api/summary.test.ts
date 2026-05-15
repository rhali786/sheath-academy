/** @jest-environment node */

import { GET } from '@/features/attendance/api/routes/summary'
import { resetStore } from '@/features/attendance/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

beforeEach(() => {
  resetStore()
})

function makeGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/attendance/summary')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString())
}

describe('GET /api/attendance/summary', () => {
  it('returns 400 when childId is missing', async () => {
    const res = await GET(makeGetRequest())
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns summary counts for a child', async () => {
    const res = await GET(makeGetRequest({ childId: SEED_IDS.adam }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.childId).toBe(SEED_IDS.adam)
    expect(typeof body.data.totalPresent).toBe('number')
    expect(typeof body.data.totalAbsent).toBe('number')
    expect(typeof body.data.totalPartial).toBe('number')
    expect(body.data.totalRecorded).toBe(
      body.data.totalPresent + body.data.totalAbsent + body.data.totalPartial
    )
  })

  it('counts match the seed records for adam', async () => {
    const res = await GET(makeGetRequest({ childId: SEED_IDS.adam }))
    const body = await res.json()
    // Seed has at least one present record for adam
    expect(body.data.totalPresent).toBeGreaterThan(0)
  })

  it('returns zero counts for child with no records', async () => {
    const res = await GET(makeGetRequest({ childId: 'child_with_no_records' }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.totalRecorded).toBe(0)
  })

  it('filters summary by date range', async () => {
    const res = await GET(makeGetRequest({ childId: SEED_IDS.adam, startDate: '2000-01-01', endDate: '2000-12-31' }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.totalRecorded).toBe(0)
  })
})

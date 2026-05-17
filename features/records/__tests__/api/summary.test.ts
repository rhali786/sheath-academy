/** @jest-environment node */

import { GET } from '@/features/records/api/routes/summary'
import { SEED_IDS } from '@/features/lib/seedIds'

function makeGetRequest(params: Record<string, string> = {}): Request {
  const url = new URL('http://localhost/api/reports/summary')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString())
}

describe('GET /api/reports/summary', () => {
  it('returns 400 when childId is missing', async () => {
    const res = await GET(makeGetRequest())
    const body = await res.json()

    expect(res.status).toBe(400)
    expect(body.status).toBe('error')
  })

  it('returns a records report for the selected child', async () => {
    const res = await GET(makeGetRequest({ childId: SEED_IDS.layth }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data.child.id).toBe(SEED_IDS.layth)
    expect(body.data.portfolio.count).toBeGreaterThan(0)
  })

  it('passes date range filters to the report service', async () => {
    const res = await GET(makeGetRequest({
      childId: SEED_IDS.layth,
      startDate: '2000-01-01',
      endDate: '2000-12-31',
    }))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(body.data.dateRange).toEqual({ start: '2000-01-01', end: '2000-12-31' })
    expect(body.data.attendance.totalRecorded).toBe(0)
  })
})

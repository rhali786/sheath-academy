/** @jest-environment node */

import { GET } from '@/features/planner/api/routes/lessons'
import { resetStore } from '@/features/planner/server/service'

beforeEach(() => {
  resetStore()
})

function makeRequest(params: Record<string, string>): Request {
  const url = new URL('http://localhost/api/planner/lessons')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  return new Request(url.toString())
}

describe('GET /api/planner/lessons — week filter', () => {
  it('returns only lessons for the specified week (Mon–Sun span)', async () => {
    const res = await GET(makeRequest({ week: '2026-05-11' }))
    const body = await res.json()
    expect(body.status).toBe('success')
    // All seed lessons are for week of 2026-05-11 (Mon May 11 – Sun May 17)
    body.data.forEach((l: { dueDate: string }) => {
      expect(l.dueDate >= '2026-05-11').toBe(true)
      expect(l.dueDate <= '2026-05-17').toBe(true)
    })
  })

  it('returns empty array when week has no lessons', async () => {
    const res = await GET(makeRequest({ week: '2024-01-01' }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns 400 when week param is not a valid ISO date', async () => {
    const res = await GET(makeRequest({ week: 'not-a-date' }))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns all lessons when week param is omitted', async () => {
    const res = await GET(makeRequest({}))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.length).toBeGreaterThan(0)
  })

  it('filters by week AND childIds together', async () => {
    const res = await GET(makeRequest({ week: '2026-05-11', childIds: 'SEED_ADAM_CHILD_ID' }))
    const body = await res.json()
    // Non-existent childId → empty
    expect(body.data).toEqual([])
  })
})

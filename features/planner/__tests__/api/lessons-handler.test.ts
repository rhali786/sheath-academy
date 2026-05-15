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

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function getMondayOfCurrentWeek(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
  return formatLocalDate(monday)
}

function getSundayOfCurrentWeek(): string {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  return formatLocalDate(sunday)
}

describe('GET /api/planner/lessons — week filter', () => {
  it('returns only lessons for the specified week (Mon–Sun span)', async () => {
    const weekStart = getMondayOfCurrentWeek()
    const weekEnd = getSundayOfCurrentWeek()
    const res = await GET(makeRequest({ week: weekStart }))
    const body = await res.json()
    expect(body.status).toBe('success')
    body.data.forEach((l: { dueDate: string }) => {
      expect(l.dueDate >= weekStart).toBe(true)
      expect(l.dueDate <= weekEnd).toBe(true)
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
    const weekStart = getMondayOfCurrentWeek()
    const res = await GET(makeRequest({ week: weekStart, childIds: 'SEED_ADAM_CHILD_ID' }))
    const body = await res.json()
    // Non-existent childId → empty
    expect(body.data).toEqual([])
  })
})

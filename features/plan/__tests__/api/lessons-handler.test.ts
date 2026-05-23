/** @jest-environment node */

jest.mock('@/features/lib/server/tenant', () => ({
  getHouseholdContext: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' }),
}))

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
  sessionAuthCtx: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test' }),
}))

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
  createLessonTaskRow: jest.fn(),
}))

jest.mock('@/features/admin-metrics/server/instrument', () => ({
  trackSessionStarted: jest.fn(),
}))

import { listLessonTaskRows, createLessonTaskRow } from '@/features/plan/server/repository'
import { GET, POST } from '@/features/plan/api/routes/lessons'

const mockList = listLessonTaskRows as jest.Mock
const mockCreate = createLessonTaskRow as jest.Mock

function makeRow(id = 'lt_1', status = 'not_started') {
  return { id, householdId: 'hh_test', learnerId: 'l1', subjectId: 's1', title: 'Task', dueDate: '2026-05-17', status, sortOrder: 0, description: null, notes: null, completedAt: null, skippedAt: null, createdAt: new Date(), updatedAt: new Date() }
}

beforeEach(() => { mockList.mockReset(); mockCreate.mockReset() })

describe('GET /api/plan/lessons', () => {
  it('returns empty array when no lessons', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/plan/lessons'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns lessons from repository', async () => {
    mockList.mockResolvedValue([makeRow()])
    const res = await GET(new Request('http://localhost/api/plan/lessons'))
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('lt_1')
  })

  it('returns 400 for invalid week parameter', async () => {
    const res = await GET(new Request('http://localhost/api/plan/lessons?week=not-a-date'))
    expect(res.status).toBe(400)
  })
})

describe('POST /api/plan/lessons', () => {
  it('returns 400 when required fields missing', async () => {
    const req = new Request('http://localhost/api/plan/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates and returns a lesson', async () => {
    mockCreate.mockResolvedValue(makeRow('lt_new'))
    const req = new Request('http://localhost/api/plan/lessons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: 'l1', title: 'New task', dueDate: '2026-05-17' }) })
    const res = await POST(req)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.id).toBe('lt_new')
  })
})

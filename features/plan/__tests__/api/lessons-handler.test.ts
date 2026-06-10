/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),

}))

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
  createLessonTaskRow: jest.fn(),
  createLessonTasksFanOut: jest.fn(),
}))

jest.mock('@/features/admin-metrics/server/instrument', () => ({
  trackSessionStarted: jest.fn(),
}))

import { listLessonTaskRows, createLessonTaskRow, createLessonTasksFanOut } from '@/features/plan/server/repository'
import { GET, POST } from '@/features/plan/api/routes/lessons'

const mockList = listLessonTaskRows as jest.Mock
const mockCreate = createLessonTaskRow as jest.Mock
const mockFanOut = createLessonTasksFanOut as jest.Mock

function makeRow(id = 'lt_1', status = 'not_started', overrides: Record<string, unknown> = {}) {
  return { id, householdId: 'hh_test', learnerId: 'l1', subjectId: 's1', title: 'Task', dueDate: '2026-05-17', status, sortOrder: 0, description: null, notes: null, resourceLink: null, lessonType: null, estimatedDuration: null, plannedStartDate: null, groupId: null, completedAt: null, skippedAt: null, createdAt: new Date(), updatedAt: new Date(), ...overrides }
}

beforeEach(() => { mockList.mockReset(); mockCreate.mockReset(); mockFanOut.mockReset() })

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

  it('passes explicit startDate and endDate filters to the repository', async () => {
    mockList.mockResolvedValue([makeRow()])

    const res = await GET(new Request('http://localhost/api/plan/lessons?startDate=2026-05-23&endDate=2026-05-23'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.data).toHaveLength(1)
    expect(mockList).toHaveBeenCalledWith('hh_test', { startDate: '2026-05-23', endDate: '2026-05-23' })
  })

  it('returns 400 for invalid explicit date filters', async () => {
    const res = await GET(new Request('http://localhost/api/plan/lessons?startDate=bad-date'))
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

  it('passes resourceLink/lessonType/estimatedDuration through to the repository', async () => {
    mockCreate.mockResolvedValue(makeRow('lt_new', 'not_started', {
      resourceLink: 'https://example.com/video',
      lessonType: 'Video',
      estimatedDuration: '30min',
    }))
    const req = new Request('http://localhost/api/plan/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childId: 'l1',
        title: 'New task',
        dueDate: '2026-05-17',
        resourceLink: 'https://example.com/video',
        lessonType: 'Video',
        estimatedDuration: '30min',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(mockCreate).toHaveBeenCalledWith('hh_test', expect.objectContaining({
      resourceLink: 'https://example.com/video',
      lessonType: 'Video',
      estimatedDuration: '30min',
    }))
    expect(body.data.resourceLink).toBe('https://example.com/video')
    expect(body.data.lessonType).toBe('Video')
    expect(body.data.estimatedDuration).toBe('30min')
  })

  it('fans out to createLessonTasksFanOut when childIds has 2+ learners', async () => {
    mockFanOut.mockResolvedValue([
      makeRow('lt_a', 'not_started', { learnerId: 'l1', groupId: 'group_1' }),
      makeRow('lt_b', 'not_started', { learnerId: 'l2', groupId: 'group_1' }),
    ])
    const req = new Request('http://localhost/api/plan/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        childIds: ['l1', 'l2'],
        assignments: [{ learnerId: 'l1', subjectId: 's1' }, { learnerId: 'l2', subjectId: 's2' }],
        title: 'Shared task',
        dueDate: '2026-05-17',
      }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(mockFanOut).toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
    expect(body.data.groupId).toBe('group_1')
  })
})

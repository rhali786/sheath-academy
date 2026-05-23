/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))

import { listLessonTaskRows } from '@/features/plan/server/repository'
import { GET } from '@/features/plan/api/routes/history'

const mockList = listLessonTaskRows as jest.Mock

function makeRow(id: string, dueDate: string, status: string) {
  return { id, householdId: 'hh_test', learnerId: 'l1', subjectId: 's1', title: 'Task', dueDate, status, sortOrder: 0, description: null, notes: null, completedAt: null, skippedAt: null, createdAt: new Date(), updatedAt: new Date() }
}

beforeEach(() => { mockList.mockReset() })

describe('GET /api/plan/history', () => {
  it('returns empty array when no lessons', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/plan/history'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(Array.isArray(body.data)).toBe(true)
  })

  it('returns 400 for negative limit', async () => {
    const res = await GET(new Request('http://localhost/api/plan/history?limit=-1'))
    expect(res.status).toBe(400)
  })

  it('returns completed lessons from repository', async () => {
    mockList.mockResolvedValue([
      makeRow('lt_1', '2026-05-10', 'completed'),
      makeRow('lt_2', '2026-05-11', 'not_started'),
    ])
    const res = await GET(new Request('http://localhost/api/plan/history'))
    const body = await res.json()
    expect(body.status).toBe('success')
    // history filter includes completed/skipped
    expect(body.data.some((l: { id: string }) => l.id === 'lt_1')).toBe(true)
  })
})

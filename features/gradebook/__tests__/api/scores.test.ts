/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/gradebook/server/repository', () => ({
  listScores: jest.fn(),
}))

import { listScores } from '@/features/gradebook/server/repository'
import { GET } from '@/features/gradebook/api/routes/scores'

const mockList = listScores as jest.Mock

function makeScore(id = 'score_1') {
  return {
    id,
    attemptId: 'attempt_1',
    subjectId: 'sub_1',
    learnerId: 'l1',
    householdId: 'hh_test',
    state: 'graded' as const,
    numericValue: 88,
    source: 'parent' as const,
    occurredAt: '2026-05-01',
  }
}

beforeEach(() => { mockList.mockReset() })

describe('GET /api/gradebook/scores', () => {
  it('returns 400 when learnerId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/gradebook/scores?subjectId=sub_1'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns 400 when subjectId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/gradebook/scores?learnerId=l1'))
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('returns empty array when no scores', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/gradebook/scores?learnerId=l1&subjectId=sub_1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns scores with correct shape', async () => {
    mockList.mockResolvedValue([makeScore()])
    const res = await GET(new Request('http://localhost/api/gradebook/scores?learnerId=l1&subjectId=sub_1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data[0]).toMatchObject({ id: 'score_1', numericValue: 88, state: 'graded' })
    expect(mockList).toHaveBeenCalledWith('hh_test', 'l1', 'sub_1')
  })
})

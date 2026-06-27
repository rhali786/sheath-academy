/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/gradebook/server/repository', () => ({
  listGradebookSummaries: jest.fn(),
}))

import { listGradebookSummaries } from '@/features/gradebook/server/repository'
import { GET } from '@/features/gradebook/api/routes/summaries'

const mockList = listGradebookSummaries as jest.Mock

function makeSummary(learnerId = 'l1') {
  return {
    learnerId,
    learnerName: 'Layth',
    gradeBand: 'g5_8' as const,
    subjects: [],
    gpa: { weighted: null, unweighted: null, totalCreditHours: 0 },
    needsAttentionSubjects: [],
  }
}

beforeEach(() => { mockList.mockReset() })

describe('GET /api/gradebook/summaries', () => {
  it('returns empty array when no learners', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/gradebook/summaries'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
    expect(body.timestamp).toBeTruthy()
  })

  it('returns summaries with correct shape', async () => {
    mockList.mockResolvedValue([makeSummary('l1'), makeSummary('l2')])
    const res = await GET(new Request('http://localhost/api/gradebook/summaries'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(2)
    expect(body.data[0]).toMatchObject({
      learnerId: 'l1',
      learnerName: 'Layth',
      gradeBand: 'g5_8',
      gpa: { weighted: null, unweighted: null, totalCreditHours: 0 },
    })
  })

  it('returns 500 when repository throws', async () => {
    mockList.mockRejectedValue(new Error('db error'))
    const res = await GET(new Request('http://localhost/api/gradebook/summaries'))
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.status).toBe('error')
  })
})

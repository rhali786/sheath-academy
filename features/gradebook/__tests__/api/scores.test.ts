/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/gradebook/server/repository', () => {
  const actual = jest.requireActual('@/features/gradebook/server/repository')
  return {
    rowToScore: actual.rowToScore,
    listScores: jest.fn(),
    createScore: jest.fn(),
  }
})

import { listScores, createScore } from '@/features/gradebook/server/repository'
import { GET, POST } from '@/features/gradebook/api/routes/scores'

const mockList = listScores as jest.Mock
const mockCreate = createScore as jest.Mock

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'score_new',
    householdId: 'hh_test',
    learnerId: 'l1',
    subjectId: 'sub_1',
    lessonTaskId: null,
    state: 'graded',
    numericValue: '88',
    source: 'parent',
    occurredAt: new Date('2026-05-01'),
    comment: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function postReq(body: unknown) {
  return new Request('http://localhost/api/gradebook/scores', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function makeScore(id = 'score_1') {
  return {
    id,
    subjectId: 'sub_1',
    learnerId: 'l1',
    householdId: 'hh_test',
    state: 'graded' as const,
    numericValue: 88,
    source: 'parent' as const,
    occurredAt: '2026-05-01',
  }
}

beforeEach(() => { mockList.mockReset(); mockCreate.mockReset() })

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

describe('POST /api/gradebook/scores', () => {
  it('returns 400 when learnerId is missing', async () => {
    const res = await POST(postReq({ subjectId: 'sub_1', state: 'graded', numericValue: 90 }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 when subjectId is missing', async () => {
    const res = await POST(postReq({ learnerId: 'l1', state: 'graded', numericValue: 90 }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when state is missing or invalid', async () => {
    const res = await POST(postReq({ learnerId: 'l1', subjectId: 'sub_1' }))
    expect(res.status).toBe(400)
    const res2 = await POST(postReq({ learnerId: 'l1', subjectId: 'sub_1', state: 'bogus' }))
    expect(res2.status).toBe(400)
  })

  it('returns 400 when graded but numericValue is missing', async () => {
    const res = await POST(postReq({ learnerId: 'l1', subjectId: 'sub_1', state: 'graded' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates a graded score and returns 201', async () => {
    mockCreate.mockResolvedValue(makeRow())
    const res = await POST(postReq({ learnerId: 'l1', subjectId: 'sub_1', state: 'graded', numericValue: 88, occurredAt: '2026-05-01' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toMatchObject({ id: 'score_new', numericValue: 88, state: 'graded' })
    expect(mockCreate).toHaveBeenCalledWith('hh_test', expect.objectContaining({
      learnerId: 'l1', subjectId: 'sub_1', state: 'graded', numericValue: 88, source: 'parent',
    }))
  })

  it('creates a non-graded score with null numericValue', async () => {
    mockCreate.mockResolvedValue(makeRow({ state: 'excused', numericValue: null }))
    const res = await POST(postReq({ learnerId: 'l1', subjectId: 'sub_1', state: 'excused' }))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith('hh_test', expect.objectContaining({ state: 'excused', numericValue: null }))
  })
})

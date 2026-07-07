/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/gradebook/server/repository', () => {
  const actual = jest.requireActual('@/features/gradebook/server/repository')
  return {
    rowToScore: actual.rowToScore,
    updateScore: jest.fn(),
    deleteScore: jest.fn(),
  }
})

import { updateScore, deleteScore } from '@/features/gradebook/server/repository'
import { PATCH, DELETE } from '@/features/gradebook/api/routes/scores-id'

const mockUpdate = updateScore as jest.Mock
const mockDelete = deleteScore as jest.Mock

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'score_1',
    householdId: 'hh_test',
    learnerId: 'l1',
    subjectId: 'sub_1',
    lessonTaskId: null,
    state: 'graded',
    numericValue: '95',
    source: 'parent',
    occurredAt: new Date('2026-05-01'),
    comment: 'retake',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

function patchReq(body: unknown) {
  return new Request('http://localhost/api/gradebook/scores/score_1', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => { mockUpdate.mockReset(); mockDelete.mockReset() })

describe('PATCH /api/gradebook/scores/:id', () => {
  it('returns 400 for an invalid state', async () => {
    const res = await PATCH('score_1', patchReq({ state: 'bogus' }))
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 400 when state is graded without numericValue', async () => {
    const res = await PATCH('score_1', patchReq({ state: 'graded' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when the score does not exist', async () => {
    mockUpdate.mockResolvedValue(undefined)
    const res = await PATCH('nope', patchReq({ state: 'graded', numericValue: 80 }))
    expect(res.status).toBe(404)
  })

  it('updates a score and returns the mapped result', async () => {
    mockUpdate.mockResolvedValue(makeRow())
    const res = await PATCH('score_1', patchReq({ state: 'graded', numericValue: 95, comment: 'retake' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toMatchObject({ id: 'score_1', numericValue: 95, comment: 'retake' })
    expect(mockUpdate).toHaveBeenCalledWith('score_1', 'hh_test', expect.objectContaining({ state: 'graded', numericValue: 95 }))
  })

  it('clears numericValue when state becomes non-graded', async () => {
    mockUpdate.mockResolvedValue(makeRow({ state: 'excused', numericValue: null }))
    await PATCH('score_1', patchReq({ state: 'excused', numericValue: 88 }))
    expect(mockUpdate).toHaveBeenCalledWith('score_1', 'hh_test', expect.objectContaining({ state: 'excused', numericValue: null }))
  })
})

describe('DELETE /api/gradebook/scores/:id', () => {
  it('returns 404 when nothing was deleted', async () => {
    mockDelete.mockResolvedValue(false)
    const res = await DELETE('nope')
    expect(res.status).toBe(404)
  })

  it('deletes a score and returns success', async () => {
    mockDelete.mockResolvedValue(true)
    const res = await DELETE('score_1')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(mockDelete).toHaveBeenCalledWith('score_1', 'hh_test')
  })
})

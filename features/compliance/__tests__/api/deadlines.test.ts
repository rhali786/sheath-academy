/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/compliance/server/repository', () => ({
  listDeadlines: jest.fn(),
  createDeadline: jest.fn(),
  updateDeadline: jest.fn(),
  deleteDeadline: jest.fn(),
}))

import { createDeadline, updateDeadline, deleteDeadline } from '@/features/compliance/server/repository'
import { POST } from '@/features/compliance/api/routes/deadlines'
import { PATCH, DELETE } from '@/features/compliance/api/routes/deadlines-id'

const mockCreate = createDeadline as jest.Mock
const mockUpdate = updateDeadline as jest.Mock
const mockDelete = deleteDeadline as jest.Mock

function makeDeadline(overrides: Record<string, unknown> = {}) {
  return {
    id: 'deadline_1', householdId: 'hh_test', schoolYearId: 'sy1',
    label: 'Annual filing', dueDate: '2026-09-01', isCompleted: false, requirementType: 'filing',
    ...overrides,
  }
}

function jsonReq(method: string, body: unknown) {
  return new Request('http://localhost/api/compliance/deadlines', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => { mockCreate.mockReset(); mockUpdate.mockReset(); mockDelete.mockReset() })

describe('POST /api/compliance/deadlines', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await POST(jsonReq('POST', { label: 'x' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates a deadline and returns 201', async () => {
    mockCreate.mockResolvedValue(makeDeadline())
    const res = await POST(jsonReq('POST', { schoolYearId: 'sy1', label: 'Annual filing', dueDate: '2026-09-01', requirementType: 'filing' }))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.data).toMatchObject({ id: 'deadline_1' })
    expect(mockCreate).toHaveBeenCalledWith('hh_test', expect.objectContaining({ schoolYearId: 'sy1', label: 'Annual filing' }))
  })
})

describe('PATCH /api/compliance/deadlines/:id', () => {
  it('returns 404 when the deadline does not exist', async () => {
    mockUpdate.mockResolvedValue(null)
    const res = await PATCH('nope', jsonReq('PATCH', { isCompleted: true }))
    expect(res.status).toBe(404)
  })

  it('marks a deadline complete', async () => {
    mockUpdate.mockResolvedValue(makeDeadline({ isCompleted: true }))
    const res = await PATCH('deadline_1', jsonReq('PATCH', { isCompleted: true }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.isCompleted).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith('deadline_1', 'hh_test', expect.objectContaining({ isCompleted: true }))
  })
})

describe('DELETE /api/compliance/deadlines/:id', () => {
  it('returns 404 when nothing removed', async () => {
    mockDelete.mockResolvedValue(false)
    const res = await DELETE('nope')
    expect(res.status).toBe(404)
  })

  it('deletes a deadline', async () => {
    mockDelete.mockResolvedValue(true)
    const res = await DELETE('deadline_1')
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith('deadline_1', 'hh_test')
  })
})

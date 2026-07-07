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
  listLessonSteps: jest.fn(),
  createLessonStep: jest.fn(),
  updateLessonStep: jest.fn(),
  deleteLessonStep: jest.fn(),
}))

import {
  listLessonSteps,
  createLessonStep,
  updateLessonStep,
  deleteLessonStep,
} from '@/features/plan/server/repository'
import { assertSessionOwnership } from '@/features/auth/server/routeOwnership'
import { GET, POST, PATCH, DELETE } from '@/features/plan/api/routes/lesson-steps'

const mockList = listLessonSteps as jest.Mock
const mockCreate = createLessonStep as jest.Mock
const mockUpdate = updateLessonStep as jest.Mock
const mockDelete = deleteLessonStep as jest.Mock
const mockAssertOwnership = assertSessionOwnership as jest.Mock

function makeStep(overrides: Record<string, unknown> = {}) {
  return {
    id: 'step_1', lessonTaskId: 'lt_1', order: 0, stepText: 'Read p.10',
    type: 'instruction', doneCriteria: null, quantity: null,
    createdAt: new Date(), updatedAt: new Date(), ...overrides,
  }
}

function jsonReq(method: string, body: unknown) {
  return new Request('http://localhost/api/plan/lessons/lt_1/steps', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockList.mockReset(); mockCreate.mockReset(); mockUpdate.mockReset(); mockDelete.mockReset()
  mockAssertOwnership.mockReset().mockResolvedValue(undefined)
})

describe('GET /api/plan/lessons/:id/steps', () => {
  it('guards lesson ownership and returns mapped steps', async () => {
    mockList.mockResolvedValue([makeStep()])
    const res = await GET('lt_1')
    const body = await res.json()
    expect(mockAssertOwnership).toHaveBeenCalledWith('lesson', 'lt_1')
    expect(body.status).toBe('success')
    expect(body.data[0]).toMatchObject({ id: 'step_1', stepText: 'Read p.10' })
  })
})

describe('POST /api/plan/lessons/:id/steps', () => {
  it('returns 400 when stepText is missing', async () => {
    const res = await POST('lt_1', jsonReq('POST', { type: 'reading' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('returns 400 for an invalid type', async () => {
    const res = await POST('lt_1', jsonReq('POST', { stepText: 'x', type: 'bogus' }))
    expect(res.status).toBe(400)
  })

  it('creates a step, defaulting order to the current count', async () => {
    mockList.mockResolvedValue([makeStep(), makeStep({ id: 'step_2' })])
    mockCreate.mockResolvedValue(makeStep({ id: 'step_3', order: 2, stepText: 'Solve set B' }))
    const res = await POST('lt_1', jsonReq('POST', { stepText: 'Solve set B' }))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({ lessonTaskId: 'lt_1', order: 2, stepText: 'Solve set B' }))
  })
})

describe('PATCH /api/plan/lessons/:id/steps/:stepId', () => {
  it('returns 404 when the step does not exist', async () => {
    mockUpdate.mockResolvedValue(null)
    const res = await PATCH('lt_1', 'nope', jsonReq('PATCH', { stepText: 'edited' }))
    expect(res.status).toBe(404)
  })

  it('updates a step', async () => {
    mockUpdate.mockResolvedValue(makeStep({ stepText: 'edited' }))
    const res = await PATCH('lt_1', 'step_1', jsonReq('PATCH', { stepText: 'edited' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith('step_1', 'lt_1', expect.objectContaining({ stepText: 'edited' }))
  })
})

describe('DELETE /api/plan/lessons/:id/steps/:stepId', () => {
  it('returns 404 when nothing removed', async () => {
    mockDelete.mockResolvedValue(false)
    const res = await DELETE('lt_1', 'nope')
    expect(res.status).toBe(404)
  })

  it('deletes a step', async () => {
    mockDelete.mockResolvedValue(true)
    const res = await DELETE('lt_1', 'step_1')
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith('step_1', 'lt_1')
  })
})

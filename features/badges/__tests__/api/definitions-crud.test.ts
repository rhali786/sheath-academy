/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/badges/server/repository', () => ({
  createBadgeDefinition: jest.fn(),
  getBadgeDefinitionById: jest.fn(),
  updateBadgeDefinition: jest.fn(),
  deleteBadgeDefinition: jest.fn(),
}))

import {
  createBadgeDefinition,
  getBadgeDefinitionById,
  updateBadgeDefinition,
  deleteBadgeDefinition,
} from '@/features/badges/server/repository'
import { POST } from '@/features/badges/api/routes/definitions'
import { PATCH, DELETE } from '@/features/badges/api/routes/definitions-id'

const mockCreate = createBadgeDefinition as jest.Mock
const mockGetById = getBadgeDefinitionById as jest.Mock
const mockUpdate = updateBadgeDefinition as jest.Mock
const mockDelete = deleteBadgeDefinition as jest.Mock

function makeDef(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bd_1', householdId: 'hh_test', title: 'Custom', description: 'd', criteria: 'c',
    emblemKey: 'e', gradeBands: [], verificationRequirement: 'none', isStarter: false,
    enabled: true, visibility: 'household', ...overrides,
  }
}

function jsonReq(method: string, body: unknown) {
  return new Request('http://localhost/api/badges/definitions', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockCreate.mockReset(); mockGetById.mockReset(); mockUpdate.mockReset(); mockDelete.mockReset()
})

describe('POST /api/badges/definitions', () => {
  it('returns 400 when required fields are missing', async () => {
    const res = await POST(jsonReq('POST', { title: 'x' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates a custom badge and returns 201', async () => {
    mockCreate.mockResolvedValue(makeDef())
    const res = await POST(jsonReq('POST', { title: 'Custom', description: 'd', criteria: 'c', emblemKey: 'e' }))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith('hh_test', expect.objectContaining({ title: 'Custom', emblemKey: 'e' }))
  })
})

describe('PATCH /api/badges/definitions/:id', () => {
  it('returns 404 when the badge does not exist', async () => {
    mockGetById.mockResolvedValue(null)
    const res = await PATCH('nope', jsonReq('PATCH', { title: 'x' }))
    expect(res.status).toBe(404)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 403 for a platform starter badge', async () => {
    mockGetById.mockResolvedValue(makeDef({ householdId: null, isStarter: true }))
    const res = await PATCH('bd_starter', jsonReq('PATCH', { title: 'x' }))
    expect(res.status).toBe(403)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('returns 403 for a badge owned by another household', async () => {
    mockGetById.mockResolvedValue(makeDef({ householdId: 'hh_other' }))
    const res = await PATCH('bd_1', jsonReq('PATCH', { title: 'x' }))
    expect(res.status).toBe(403)
  })

  it('updates an owned badge', async () => {
    mockGetById.mockResolvedValue(makeDef())
    mockUpdate.mockResolvedValue(makeDef({ title: 'Renamed' }))
    const res = await PATCH('bd_1', jsonReq('PATCH', { title: 'Renamed' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.title).toBe('Renamed')
    expect(mockUpdate).toHaveBeenCalledWith('bd_1', 'hh_test', expect.objectContaining({ title: 'Renamed' }))
  })
})

describe('DELETE /api/badges/definitions/:id', () => {
  it('returns 403 for a starter badge', async () => {
    mockGetById.mockResolvedValue(makeDef({ householdId: null, isStarter: true }))
    const res = await DELETE('bd_starter')
    expect(res.status).toBe(403)
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes an owned badge', async () => {
    mockGetById.mockResolvedValue(makeDef())
    mockDelete.mockResolvedValue(true)
    const res = await DELETE('bd_1')
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith('bd_1', 'hh_test')
  })
})

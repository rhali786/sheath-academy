/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/settings/server/repository', () => ({
  getAllHouseholdSettings: jest.fn(),
  setHouseholdSetting: jest.fn(),
}))

import { getAllHouseholdSettings, setHouseholdSetting } from '@/features/settings/server/repository'
import { GET, PUT } from '@/features/settings/api/routes/settings'

const mockGetAll = getAllHouseholdSettings as jest.Mock
const mockSet = setHouseholdSetting as jest.Mock

function jsonReq(body: unknown) {
  return new Request('http://localhost/api/settings', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockGetAll.mockReset()
  mockSet.mockReset()
})

describe('GET /api/settings', () => {
  it('returns stored household settings', async () => {
    mockGetAll.mockResolvedValue({ 'planning.maxLessonsPerDay': 3 })
    const res = await GET(new Request('http://localhost/api/settings'))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toEqual({ 'planning.maxLessonsPerDay': 3 })
    expect(mockGetAll).toHaveBeenCalledWith('hh_test')
  })
})

describe('PUT /api/settings', () => {
  it('returns 400 when body is not an object', async () => {
    const res = await PUT(jsonReq(['not', 'an', 'object']))
    expect(res.status).toBe(400)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('upserts each provided key and returns the updated map', async () => {
    mockSet.mockResolvedValue(undefined)
    mockGetAll.mockResolvedValue({ 'planning.maxLessonsPerDay': 5 })

    const res = await PUT(jsonReq({ 'planning.maxLessonsPerDay': 5 }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(mockSet).toHaveBeenCalledWith('hh_test', 'planning.maxLessonsPerDay', 5)
    expect(body.data).toEqual({ 'planning.maxLessonsPerDay': 5 })
  })
})

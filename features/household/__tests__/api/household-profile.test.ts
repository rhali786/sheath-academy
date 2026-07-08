/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

// Mutable household row so PUT → GET round-trips can be asserted with the
// repository boundary mocked (never mock getDb's internals beyond returning rows).
const mockHouseholdState: { row: Record<string, unknown> | null } = {
  row: { id: 'hh_test', name: 'Test Household', timezone: 'UTC', logoPreset: null, createdAt: new Date() },
}

jest.mock('@/features/lib/server/db', () => ({
  getDb: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockImplementation(() => Promise.resolve(mockHouseholdState.row ? [mockHouseholdState.row] : [])),
    update: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
  })),
}))

jest.mock('@/features/settings/server/repository', () => ({
  getAllHouseholdSettings: jest.fn().mockResolvedValue({}),
  setHouseholdSetting: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/household/server/repository', () => ({
  updateHouseholdName: jest.fn().mockResolvedValue(undefined),
  updateHouseholdTimezone: jest.fn().mockResolvedValue(undefined),
  updateHouseholdLogoPreset: jest.fn().mockImplementation(async (_id: string, preset: string | null) => {
    if (mockHouseholdState.row) mockHouseholdState.row.logoPreset = preset
  }),
}))

import { GET, PUT } from '@/features/household/api/routes/household-profile'
import { updateHouseholdLogoPreset } from '@/features/household/server/repository'

function putReq(body: unknown): Request {
  return new Request('http://localhost/api/household/profile', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockHouseholdState.row = { id: 'hh_test', name: 'Test Household', timezone: 'UTC', logoPreset: null, createdAt: new Date() }
  jest.clearAllMocks()
})

describe('GET /api/household/profile', () => {
  it('returns null data when no household row found', async () => {
    mockHouseholdState.row = null
    const res = await GET()
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toBeNull()
  })

  it('returns logoPreset undefined for a household that never set one', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.logoPreset).toBeUndefined()
  })
})

describe('PUT /api/household/profile', () => {
  it('returns 400 when no valid fields provided', async () => {
    const res = await PUT(putReq({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid weekStartDay', async () => {
    const res = await PUT(putReq({ weekStartDay: 'NotADay' }))
    expect(res.status).toBe(400)
  })

  it('persists logoPreset and a subsequent GET returns it', async () => {
    const res = await PUT(putReq({ logoPreset: 'crescent' }))
    expect(res.status).toBe(200)
    expect(updateHouseholdLogoPreset).toHaveBeenCalledWith('hh_test', 'crescent')
    const body = await res.json()
    expect(body.data.logoPreset).toBe('crescent')
  })

  it('rejects an unknown logoPreset key with HTTP 400', async () => {
    const res = await PUT(putReq({ logoPreset: 'not-a-real-preset' }))
    expect(res.status).toBe(400)
    expect(updateHouseholdLogoPreset).not.toHaveBeenCalled()
  })
})

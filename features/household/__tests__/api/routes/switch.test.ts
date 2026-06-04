/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_a', userId: 'user_1', email: 'a@test.com' })
})

jest.mock('@/features/household/server/repository', () => ({
  getMembership: jest.fn(),
  getHouseholdById: jest.fn(),
}))

jest.mock('@/features/settings/server/repository', () => ({
  setUserSetting: jest.fn(),
}))

import { POST } from '@/features/household/api/routes/switch'
import { getMembership, getHouseholdById } from '@/features/household/server/repository'
import { setUserSetting } from '@/features/settings/server/repository'

const mockGetMembership = jest.mocked(getMembership)
const mockGetHouseholdById = jest.mocked(getHouseholdById)
const mockSetUserSetting = jest.mocked(setUserSetting)

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/household/switch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSetUserSetting.mockResolvedValue(undefined)
})

describe('POST /api/household/switch', () => {
  it('returns 400 when householdId is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 403 when the user is not a member of the target household', async () => {
    mockGetMembership.mockResolvedValue(null)
    const res = await POST(makeRequest({ householdId: 'hh_other' }))
    expect(res.status).toBe(403)
  })

  it('returns 200 and the new householdId and timezone on success', async () => {
    mockGetMembership.mockResolvedValue({ householdId: 'hh_b', userId: 'user_1', role: 'member' })
    mockGetHouseholdById.mockResolvedValue({ id: 'hh_b', timezone: 'America/Chicago', name: 'HH B' })

    const res = await POST(makeRequest({ householdId: 'hh_b' }))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data.householdId).toBe('hh_b')
    expect(body.data.timezone).toBe('America/Chicago')
  })

  it('persists the new active_household_id to user_settings', async () => {
    mockGetMembership.mockResolvedValue({ householdId: 'hh_b', userId: 'user_1', role: 'member' })
    mockGetHouseholdById.mockResolvedValue({ id: 'hh_b', timezone: 'America/Chicago', name: 'HH B' })

    await POST(makeRequest({ householdId: 'hh_b' }))

    expect(mockSetUserSetting).toHaveBeenCalledWith('user_1', 'active_household_id', 'hh_b')
  })
})

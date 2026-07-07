/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/badges/server/repository', () => ({
  getBadgeSettings: jest.fn(),
  setBadgeSettings: jest.fn(),
}))

import { setBadgeSettings } from '@/features/badges/server/repository'
import { PUT } from '@/features/badges/api/routes/settings'

const mockSet = setBadgeSettings as jest.Mock

function jsonReq(body: unknown) {
  return new Request('http://localhost/api/badges/settings', {
    method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => { mockSet.mockReset() })

describe('PUT /api/badges/settings', () => {
  it('returns 400 when platformBadgesEnabled is not a boolean', async () => {
    const res = await PUT(jsonReq({}))
    expect(res.status).toBe(400)
    expect(mockSet).not.toHaveBeenCalled()
  })

  it('updates settings and returns the new value', async () => {
    mockSet.mockResolvedValue(undefined)
    const res = await PUT(jsonReq({ platformBadgesEnabled: false }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data).toMatchObject({ householdId: 'hh_test', platformBadgesEnabled: false })
    expect(mockSet).toHaveBeenCalledWith('hh_test', { platformBadgesEnabled: false })
  })
})

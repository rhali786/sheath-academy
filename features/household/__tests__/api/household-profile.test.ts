/** @jest-environment node */

jest.mock('@/features/lib/server/tenant', () => ({
  getHouseholdContext: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' }),
}))

jest.mock('@/features/lib/server/db', () => ({
  getDb: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockResolvedValue([]),
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
}))

import { GET, PUT } from '@/features/household/api/routes/household-profile'

describe('GET /api/household/profile', () => {
  it('returns null data when no household row found', async () => {
    const res = await GET()
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toBeNull()
  })
})

describe('PUT /api/household/profile', () => {
  it('returns 400 when no valid fields provided', async () => {
    const req = new Request('http://localhost/api/household/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid weekStartDay', async () => {
    const req = new Request('http://localhost/api/household/profile', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ weekStartDay: 'NotADay' }) })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })
})

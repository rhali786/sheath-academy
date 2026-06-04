/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_a', userId: 'user_owner', email: 'owner@test.com' })
})

jest.mock('@/features/household/server/repository', () => ({
  getMembership: jest.fn(),
  removeMember: jest.fn(),
}))

import { DELETE } from '@/features/household/api/routes/member-remove'
import { getMembership, removeMember } from '@/features/household/server/repository'

const mockGetMembership = jest.mocked(getMembership)
const mockRemoveMember = jest.mocked(removeMember)

const OWNER_MEMBERSHIP = { householdId: 'hh_a', userId: 'user_owner', role: 'owner' }
const TARGET_MEMBERSHIP = { householdId: 'hh_a', userId: 'user_member', role: 'member' }

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/household/member', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetMembership
    .mockResolvedValueOnce(OWNER_MEMBERSHIP as any)  // first call: requester's membership
    .mockResolvedValueOnce(TARGET_MEMBERSHIP as any) // second call: target's membership
  mockRemoveMember.mockResolvedValue(undefined)
})

describe('DELETE /api/household/member', () => {
  it('returns 400 when userId is missing', async () => {
    const res = await DELETE(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 403 when requester is not an owner', async () => {
    mockGetMembership.mockReset()
    mockGetMembership.mockResolvedValue({ ...OWNER_MEMBERSHIP, role: 'member' } as any)
    const res = await DELETE(makeRequest({ userId: 'user_member' }))
    expect(res.status).toBe(403)
  })

  it('returns 422 when trying to remove yourself', async () => {
    const res = await DELETE(makeRequest({ userId: 'user_owner' }))
    expect(res.status).toBe(422)
  })

  it('returns 404 when target user is not a member', async () => {
    mockGetMembership.mockReset()
    mockGetMembership
      .mockResolvedValueOnce(OWNER_MEMBERSHIP as any)
      .mockResolvedValueOnce(null)
    const res = await DELETE(makeRequest({ userId: 'user_not_member' }))
    expect(res.status).toBe(404)
  })

  it('returns 200 and removes the member on success', async () => {
    const res = await DELETE(makeRequest({ userId: 'user_member' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(mockRemoveMember).toHaveBeenCalledWith('hh_a', 'user_member')
  })
})

/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_a', userId: 'user_owner', email: 'owner@test.com' })
})

jest.mock('@/features/household/server/repository', () => ({
  getMembership: jest.fn(),
  getInvitationById: jest.fn(),
  markInvitationRevoked: jest.fn(),
}))

import { POST } from '@/features/household/api/routes/revoke'
import { getMembership, getInvitationById, markInvitationRevoked } from '@/features/household/server/repository'

const mockGetMembership = jest.mocked(getMembership)
const mockGetInvitationById = jest.mocked(getInvitationById)
const mockMarkRevoked = jest.mocked(markInvitationRevoked)

const OWNER_MEMBERSHIP = { householdId: 'hh_a', userId: 'user_owner', role: 'owner' }
const PENDING_INVITATION = { id: 'inv_1', householdId: 'hh_a', email: 'invitee@test.com', status: 'pending' }

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/household/invite/revoke', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockGetMembership.mockResolvedValue(OWNER_MEMBERSHIP as any)
  mockGetInvitationById.mockResolvedValue(PENDING_INVITATION as any)
  mockMarkRevoked.mockResolvedValue(undefined)
})

describe('POST /api/household/invite/revoke', () => {
  it('returns 400 when invitationId is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 403 when requester is not an owner', async () => {
    mockGetMembership.mockResolvedValue({ ...OWNER_MEMBERSHIP, role: 'member' } as any)
    const res = await POST(makeRequest({ invitationId: 'inv_1' }))
    expect(res.status).toBe(403)
  })

  it('returns 404 when invitation does not exist', async () => {
    mockGetInvitationById.mockResolvedValue(null)
    const res = await POST(makeRequest({ invitationId: 'inv_missing' }))
    expect(res.status).toBe(404)
  })

  it('returns 403 when invitation belongs to a different household', async () => {
    mockGetInvitationById.mockResolvedValue({ ...PENDING_INVITATION, householdId: 'hh_other' } as any)
    const res = await POST(makeRequest({ invitationId: 'inv_1' }))
    expect(res.status).toBe(403)
  })

  it('returns 200 and marks the invitation revoked on success', async () => {
    const res = await POST(makeRequest({ invitationId: 'inv_1' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(mockMarkRevoked).toHaveBeenCalledWith('inv_1')
  })
})

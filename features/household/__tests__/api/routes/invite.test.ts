/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_a', userId: 'user_owner', email: 'owner@test.com' })
})

jest.mock('@/features/household/server/repository', () => ({
  getMembership: jest.fn(),
  createInvitation: jest.fn(),
}))

jest.mock('@/features/household/server/invitationTokens', () => ({
  createInvitationToken: jest.fn(),
}))

jest.mock('@/features/auth/server/email', () => ({
  sendInvitationEmail: jest.fn(),
}))

import { POST } from '@/features/household/api/routes/invite'
import { getMembership, createInvitation } from '@/features/household/server/repository'
import { createInvitationToken } from '@/features/household/server/invitationTokens'
import { sendInvitationEmail } from '@/features/auth/server/email'

const mockGetMembership = jest.mocked(getMembership)
const mockCreateInvitation = jest.mocked(createInvitation)
const mockCreateInvitationToken = jest.mocked(createInvitationToken)
const mockSendInvitationEmail = jest.mocked(sendInvitationEmail)

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/household/invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const OWNER_MEMBERSHIP = { householdId: 'hh_a', userId: 'user_owner', role: 'owner' }
const TOKEN_FIXTURE = { raw: 'raw_token_abc', hash: 'hashed_abc', expiresAt: new Date(Date.now() + 86400000) }
const INVITATION_ROW = { id: 'inv_1', householdId: 'hh_a', email: 'invitee@test.com', role: 'member', tokenHash: 'hashed_abc', status: 'pending', createdAt: new Date(), updatedAt: new Date(), expiresAt: TOKEN_FIXTURE.expiresAt }

beforeEach(() => {
  jest.clearAllMocks()
  mockGetMembership.mockResolvedValue(OWNER_MEMBERSHIP as any)
  mockCreateInvitationToken.mockReturnValue(TOKEN_FIXTURE)
  mockCreateInvitation.mockResolvedValue(INVITATION_ROW as any)
  mockSendInvitationEmail.mockResolvedValue(undefined)
})

describe('POST /api/household/invite', () => {
  it('returns 400 when email is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 403 when requester is not an owner', async () => {
    mockGetMembership.mockResolvedValue({ householdId: 'hh_a', userId: 'user_owner', role: 'member' } as any)
    const res = await POST(makeRequest({ email: 'invitee@test.com' }))
    expect(res.status).toBe(403)
  })

  it('returns 403 when requester is not a member at all', async () => {
    mockGetMembership.mockResolvedValue(null)
    const res = await POST(makeRequest({ email: 'invitee@test.com' }))
    expect(res.status).toBe(403)
  })

  it('returns 200 and creates an invitation on success', async () => {
    const res = await POST(makeRequest({ email: 'invitee@test.com' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data.invitationId).toBe('inv_1')
  })

  it('stores a hashed token (never the raw token) in the DB', async () => {
    await POST(makeRequest({ email: 'invitee@test.com' }))
    expect(mockCreateInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: 'hashed_abc' }),
    )
    expect(mockCreateInvitation).not.toHaveBeenCalledWith(
      expect.objectContaining({ tokenHash: 'raw_token_abc' }),
    )
  })

  it('sends the invitation email with the raw token link', async () => {
    await POST(makeRequest({ email: 'invitee@test.com' }))
    expect(mockSendInvitationEmail).toHaveBeenCalledWith(
      expect.objectContaining({ to: 'invitee@test.com', rawToken: 'raw_token_abc' }),
    )
  })

  it('defaults role to member when not specified', async () => {
    await POST(makeRequest({ email: 'invitee@test.com' }))
    expect(mockCreateInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'member' }),
    )
  })

  it('allows specifying owner role', async () => {
    await POST(makeRequest({ email: 'invitee@test.com', role: 'owner' }))
    expect(mockCreateInvitation).toHaveBeenCalledWith(
      expect.objectContaining({ role: 'owner' }),
    )
  })
})

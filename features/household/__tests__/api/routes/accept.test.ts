/** @jest-environment node */

jest.mock('@/features/household/server/repository', () => ({
  getInvitationByTokenHash: jest.fn(),
  markInvitationAccepted: jest.fn(),
  upsertUserByEmail: jest.fn(),
  addMember: jest.fn(),
}))

jest.mock('@/features/household/server/invitationTokens', () => ({
  hashInvitationToken: jest.fn(),
}))

import { POST } from '@/features/household/api/routes/accept'
import {
  getInvitationByTokenHash,
  markInvitationAccepted,
  upsertUserByEmail,
  addMember,
} from '@/features/household/server/repository'
import { hashInvitationToken } from '@/features/household/server/invitationTokens'

const mockGetInvitation = jest.mocked(getInvitationByTokenHash)
const mockMarkAccepted = jest.mocked(markInvitationAccepted)
const mockUpsertUser = jest.mocked(upsertUserByEmail)
const mockAddMember = jest.mocked(addMember)
const mockHashToken = jest.mocked(hashInvitationToken)

const VALID_INVITATION = {
  id: 'inv_1',
  householdId: 'hh_a',
  email: 'invitee@test.com',
  role: 'member',
  tokenHash: 'hashed_abc',
  status: 'pending',
  expiresAt: new Date(Date.now() + 86400000),
  createdAt: new Date(),
  updatedAt: new Date(),
}

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/household/invite/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockHashToken.mockReturnValue('hashed_abc')
  mockGetInvitation.mockResolvedValue(VALID_INVITATION as any)
  mockUpsertUser.mockResolvedValue({ id: 'user_invitee', email: 'invitee@test.com' } as any)
  mockAddMember.mockResolvedValue({} as any)
  mockMarkAccepted.mockResolvedValue(undefined)
})

describe('POST /api/household/invite/accept', () => {
  it('returns 400 when token is missing', async () => {
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 404 when token hash matches no invitation', async () => {
    mockGetInvitation.mockResolvedValue(null)
    const res = await POST(makeRequest({ token: 'bad_token' }))
    expect(res.status).toBe(404)
  })

  it('returns 410 when invitation is already accepted', async () => {
    mockGetInvitation.mockResolvedValue({ ...VALID_INVITATION, status: 'accepted' } as any)
    const res = await POST(makeRequest({ token: 'some_token' }))
    expect(res.status).toBe(410)
  })

  it('returns 410 when invitation is revoked', async () => {
    mockGetInvitation.mockResolvedValue({ ...VALID_INVITATION, status: 'revoked' } as any)
    const res = await POST(makeRequest({ token: 'some_token' }))
    expect(res.status).toBe(410)
  })

  it('returns 410 when invitation has expired', async () => {
    mockGetInvitation.mockResolvedValue({ ...VALID_INVITATION, expiresAt: new Date(Date.now() - 1000) } as any)
    const res = await POST(makeRequest({ token: 'some_token' }))
    expect(res.status).toBe(410)
  })

  it('returns 200 and adds the member on success', async () => {
    const res = await POST(makeRequest({ token: 'raw_token_abc' }))
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data.householdId).toBe('hh_a')
  })

  it('upserts the user by email from the invitation', async () => {
    await POST(makeRequest({ token: 'raw_token_abc' }))
    expect(mockUpsertUser).toHaveBeenCalledWith('invitee@test.com', undefined, undefined)
  })

  it('adds the member with the role from the invitation', async () => {
    await POST(makeRequest({ token: 'raw_token_abc' }))
    expect(mockAddMember).toHaveBeenCalledWith('hh_a', 'user_invitee', 'member')
  })

  it('marks the invitation accepted after adding the member', async () => {
    await POST(makeRequest({ token: 'raw_token_abc' }))
    expect(mockMarkAccepted).toHaveBeenCalledWith('inv_1')
  })
})

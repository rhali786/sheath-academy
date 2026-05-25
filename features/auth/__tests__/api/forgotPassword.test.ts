/** @jest-environment node */

jest.mock('@/features/auth/server/repository', () => ({
  getUserByIdentifier: jest.fn(),
}))

jest.mock('@/features/auth/server/passwordResetTokens', () => ({
  createResetToken: jest.fn().mockResolvedValue('raw_token_abc'),
}))

jest.mock('@/features/auth/server/email', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
}))

import { POST } from '@/app/api/auth/password/forgot/route'
import { getUserByIdentifier } from '@/features/auth/server/repository'
import { createResetToken } from '@/features/auth/server/passwordResetTokens'
import { sendPasswordResetEmail } from '@/features/auth/server/email'

const mockGetUser = getUserByIdentifier as jest.Mock
const mockCreateToken = createResetToken as jest.Mock
const mockSendEmail = sendPasswordResetEmail as jest.Mock

const GENERIC_MSG = 'If this account can receive email, a reset link has been sent.'

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/password/forgot', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockGetUser.mockReset()
  mockCreateToken.mockReset()
  mockSendEmail.mockReset()
  mockCreateToken.mockResolvedValue('raw_token_abc')
  mockSendEmail.mockResolvedValue(undefined)
})

describe('POST /api/auth/password/forgot', () => {
  test('returns generic success for known email-backed user', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'parent@example.com' })
    const res = await POST(makeRequest({ identifier: 'parent@example.com' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(json.message).toBe(GENERIC_MSG)
  })

  test('sends reset email for known email-backed user', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'parent@example.com' })
    await POST(makeRequest({ identifier: 'parent@example.com' }))
    expect(mockCreateToken).toHaveBeenCalledWith('user_1')
    expect(mockSendEmail).toHaveBeenCalledWith('parent@example.com', 'raw_token_abc')
  })

  test('returns generic success for unknown identifier (does not reveal existence)', async () => {
    mockGetUser.mockResolvedValue(null)
    const res = await POST(makeRequest({ identifier: 'nobody@example.com' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe(GENERIC_MSG)
    expect(mockCreateToken).not.toHaveBeenCalled()
    expect(mockSendEmail).not.toHaveBeenCalled()
  })

  test('returns generic success when identifier is empty', async () => {
    const res = await POST(makeRequest({ identifier: '' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe(GENERIC_MSG)
  })

  test('returns generic success even when Resend send fails', async () => {
    mockGetUser.mockResolvedValue({ id: 'user_1', email: 'parent@example.com' })
    mockSendEmail.mockRejectedValue(new Error('Resend down'))
    const res = await POST(makeRequest({ identifier: 'parent@example.com' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.message).toBe(GENERIC_MSG)
  })
})

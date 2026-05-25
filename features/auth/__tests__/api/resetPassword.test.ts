/** @jest-environment node */

jest.mock('@/features/auth/server/passwordResetTokens', () => ({
  useResetToken: jest.fn(),
}))

jest.mock('@/features/auth/server/repository', () => ({
  updateUserPassword: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/auth/server/password', () => ({
  hashPassword: jest.fn().mockResolvedValue('new_hashed_password'),
}))

import { POST } from '@/app/api/auth/password/reset/route'
import { useResetToken } from '@/features/auth/server/passwordResetTokens'
import { updateUserPassword } from '@/features/auth/server/repository'

const mockUseToken = useResetToken as jest.Mock
const mockUpdatePassword = updateUserPassword as jest.Mock

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/password/reset', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockUseToken.mockReset()
  mockUpdatePassword.mockReset()
  mockUpdatePassword.mockResolvedValue(undefined)
})

describe('POST /api/auth/password/reset', () => {
  test('updates password and returns success for valid token', async () => {
    mockUseToken.mockResolvedValue('user_123')
    const res = await POST(makeRequest({ token: 'valid_token', password: 'newpass123', confirmPassword: 'newpass123' }))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(mockUpdatePassword).toHaveBeenCalledWith('user_123', 'new_hashed_password')
  })

  test('returns 400 for expired or used token', async () => {
    mockUseToken.mockResolvedValue(null)
    const res = await POST(makeRequest({ token: 'expired_token', password: 'newpass123', confirmPassword: 'newpass123' }))
    expect(res.status).toBe(400)
    expect(mockUpdatePassword).not.toHaveBeenCalled()
  })

  test('returns 400 when token is missing', async () => {
    const res = await POST(makeRequest({ token: '', password: 'newpass123', confirmPassword: 'newpass123' }))
    expect(res.status).toBe(400)
  })

  test('returns 422 when password is too short', async () => {
    const res = await POST(makeRequest({ token: 'tok', password: 'short', confirmPassword: 'short' }))
    expect(res.status).toBe(422)
  })

  test('returns 422 when passwords do not match', async () => {
    const res = await POST(makeRequest({ token: 'tok', password: 'newpass123', confirmPassword: 'different' }))
    expect(res.status).toBe(422)
  })

  test('does not update password when token is invalid (single-use)', async () => {
    mockUseToken.mockResolvedValue(null)
    await POST(makeRequest({ token: 'used_token', password: 'newpass123', confirmPassword: 'newpass123' }))
    expect(mockUpdatePassword).not.toHaveBeenCalled()
  })
})

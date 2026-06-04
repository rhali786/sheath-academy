/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/household/server/repository', () => ({
  updateUserName: jest.fn().mockResolvedValue(undefined),
}))

import { PUT } from '@/features/household/api/routes/user-profile'
import { updateUserName } from '@/features/household/server/repository'

const mockUpdateUserName = jest.mocked(updateUserName)

describe('PUT /api/household/user-profile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateUserName.mockResolvedValue(undefined)
  })

  it('returns 400 when name field is missing', async () => {
    const req = new Request('http://localhost/api/household/user-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when name is not a string', async () => {
    const req = new Request('http://localhost/api/household/user-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 123 }),
    })
    const res = await PUT(req)
    expect(res.status).toBe(400)
  })

  it('saves name and returns success', async () => {
    const req = new Request('http://localhost/api/household/user-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Fatima Ali' }),
    })
    const res = await PUT(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(mockUpdateUserName).toHaveBeenCalledWith('user_test', 'Fatima Ali')
  })

  it('clears name when empty string is sent', async () => {
    const req = new Request('http://localhost/api/household/user-profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '' }),
    })
    const res = await PUT(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(mockUpdateUserName).toHaveBeenCalledWith('user_test', null)
  })
})

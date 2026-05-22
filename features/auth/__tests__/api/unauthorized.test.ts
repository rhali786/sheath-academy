/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

import { auth } from '@/features/auth/auth'
import { GET } from '@/app/api/[...slug]/route'

const mockAuth = auth as jest.Mock

describe('Protected API choke point', () => {
  test('returns 401 JSON when no session', async () => {
    mockAuth.mockResolvedValue(null)
    const res = await GET(
      new Request('http://localhost/api/dashboard/summary'),
      { params: Promise.resolve({ slug: ['dashboard', 'summary'] }) },
    )
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.data).toBeNull()
  })
})

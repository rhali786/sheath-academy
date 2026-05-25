/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_01', userId: 'user_01', email: 'test@example.com' })
})

jest.mock('@/features/feedback/server/repository', () => ({
  insertFeedback: jest.fn(),
  listFeedback: jest.fn(),
}))

jest.mock('@/features/lib/server/requireAdminApi', () => ({
  requireAdminApi: jest.fn(),
  forbiddenResponse: jest.fn(),
}))

import { POST } from '@/features/feedback/api/routes/submit'
import { GET } from '@/features/feedback/api/routes/adminList'
import { insertFeedback, listFeedback } from '@/features/feedback/server/repository'
import { requireAdminApi } from '@/features/lib/server/requireAdminApi'

const mockInsert = insertFeedback as jest.Mock
const mockList = listFeedback as jest.Mock
const mockRequireAdmin = requireAdminApi as jest.Mock

function makeRequest(url: string, init?: RequestInit): Request {
  return new Request(`http://localhost${url}`, init)
}

beforeEach(() => {
  mockInsert.mockResolvedValue(undefined)
  mockList.mockResolvedValue([])
  mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('POST /api/feedback', () => {
  test('inserts feedback and returns 200', async () => {
    const req = makeRequest('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagePath: '/dashboard', sentiment: 'good', message: 'Love it' }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 'user_01',
        householdId: 'hh_01',
        userEmail: 'test@example.com',
        pagePath: '/dashboard',
        sentiment: 'good',
        message: 'Love it',
      }),
    )
  })

  test('omits empty message', async () => {
    const req = makeRequest('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagePath: '/lessons', sentiment: 'okay' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(200)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ message: undefined }),
    )
  })

  test('returns 400 when pagePath missing', async () => {
    const req = makeRequest('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentiment: 'good' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  test('returns 400 when sentiment is invalid', async () => {
    const req = makeRequest('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pagePath: '/dashboard', sentiment: 'amazing' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  test('returns 400 for invalid JSON', async () => {
    const req = makeRequest('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/admin/feedback', () => {
  const row = {
    id: 'fb_01',
    userId: 'user_01',
    householdId: 'hh_01',
    userEmail: 'test@example.com',
    pagePath: '/dashboard',
    sentiment: 'great' as const,
    message: 'Wonderful',
    createdAt: '2026-05-24T10:00:00Z',
  }

  test('returns feedback rows for admin', async () => {
    mockList.mockResolvedValue([row])
    const req = makeRequest('/api/admin/feedback')
    const res = await GET(req)
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].pagePath).toBe('/dashboard')
  })

  test('returns 403 for non-admin', async () => {
    const forbidden = new Response(JSON.stringify({ status: 'error', message: 'Forbidden' }), { status: 403 })
    mockRequireAdmin.mockResolvedValue({ ok: false, response: forbidden })
    const req = makeRequest('/api/admin/feedback')
    const res = await GET(req)
    expect(res.status).toBe(403)
    expect(mockList).not.toHaveBeenCalled()
  })

  test('returns empty array when no feedback exists', async () => {
    const req = makeRequest('/api/admin/feedback')
    const res = await GET(req)
    const body = await res.json()
    expect(body.data).toHaveLength(0)
  })
})

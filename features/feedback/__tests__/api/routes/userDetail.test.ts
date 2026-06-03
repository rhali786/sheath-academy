/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule()
})

jest.mock('@/features/lib/server/appAdmin', () => ({
  isAppAdmin: jest.fn((email: string) => email === 'admin@example.com'),
}))

jest.mock('@/features/feedback/server/repository', () => ({
  getFeedbackById: jest.fn(),
}))

import { getFeedbackById } from '@/features/feedback/server/repository'
import { GET } from '@/features/feedback/api/routes/userDetail'
import type { FeedbackRow } from '@/features/feedback/types'

const mockGetById = getFeedbackById as jest.Mock

const mockFeedback: FeedbackRow = {
  id: 'fb_1',
  userId: 'other-user',
  householdId: 'hh_test',
  pagePath: '/dashboard',
  sentiment: 'good',
  message: 'Works great',
  status: 'submitted',
  featureArea: null,
  feedbackType: null,
  riskLevel: null,
  confidence: null,
  duplicateOfFeedbackId: null,
  adminApprovedAt: null,
  adminApprovedByUserId: null,
  prNumber: null,
  previewUrl: null,
  uatInstructions: null,
  versionResolved: null,
  resolvedAt: null,
  changelogVersion: null,
  changelogLabel: null,
  changelogUserCredit: null,
  createdAt: '2026-05-25T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
}

beforeEach(() => {
  mockGetById.mockReset()
  jest.clearAllMocks()
})

describe('GET /api/feedback/[id] (userDetail)', () => {
  it('returns feedback when user is the owner', async () => {
    const ownerFeedback = { ...mockFeedback, userId: 'test-user' }
    mockGetById.mockResolvedValue(ownerFeedback)

    const res = await GET(new Request('http://localhost/api/feedback/fb_1'), 'fb_1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data).toEqual(ownerFeedback)
    expect(mockGetById).toHaveBeenCalledWith('fb_1')
  })

  it('returns 403 when user is not owner and not admin', async () => {
    jest.resetModules()
    jest.doMock('@/features/auth/server/requestAuth', () => {
      const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
      return mockRequestAuthModule({ userId: 'different-user', email: 'user@example.com' })
    })
    jest.doMock('@/features/lib/server/appAdmin', () => ({
      isAppAdmin: jest.fn((email: string) => email === 'admin@example.com'),
    }))
    jest.doMock('@/features/feedback/server/repository', () => ({
      getFeedbackById: jest.fn().mockResolvedValue(mockFeedback),
    }))

    const { GET: getHandler } = await import('@/features/feedback/api/routes/userDetail')
    const res = await getHandler(new Request('http://localhost/api/feedback/fb_1'), 'fb_1')

    expect(res.status).toBe(403)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.message).toContain('Forbidden')
  })

  it('returns feedback when user is admin (can access any feedback)', async () => {
    jest.resetModules()
    jest.doMock('@/features/auth/server/requestAuth', () => {
      const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
      return mockRequestAuthModule({ userId: 'admin-user', email: 'admin@example.com' })
    })
    jest.doMock('@/features/lib/server/appAdmin', () => ({
      isAppAdmin: jest.fn((email: string) => email === 'admin@example.com'),
    }))
    jest.doMock('@/features/feedback/server/repository', () => ({
      getFeedbackById: jest.fn().mockResolvedValue(mockFeedback),
    }))

    const { GET: getHandler } = await import('@/features/feedback/api/routes/userDetail')
    const res = await getHandler(new Request('http://localhost/api/feedback/fb_1'), 'fb_1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data).toEqual(mockFeedback)
  })

  it('returns 404 when feedback not found', async () => {
    mockGetById.mockResolvedValue(null)

    const res = await GET(new Request('http://localhost/api/feedback/fb_1'), 'fb_1')

    expect(res.status).toBe(404)
  })

  it('returns 401 when user is not authenticated', async () => {
    jest.resetModules()
    jest.doMock('@/features/auth/server/requestAuth', () => {
      const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
      return mockRequestAuthModule({ userId: null })
    })

    const { GET: getHandler } = await import('@/features/feedback/api/routes/userDetail')
    const res = await getHandler(new Request('http://localhost/api/feedback/fb_1'), 'fb_1')

    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.message).toContain('Unauthorized')
  })
})

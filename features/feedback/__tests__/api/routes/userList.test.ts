/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule()
})

jest.mock('@/features/feedback/server/repository', () => ({
  listFeedbackByUserId: jest.fn(),
}))

import { listFeedbackByUserId } from '@/features/feedback/server/repository'
import { GET } from '@/features/feedback/api/routes/userList'
import type { FeedbackRow } from '@/features/feedback/types'

const mockListByUserId = listFeedbackByUserId as jest.Mock

beforeEach(() => {
  mockListByUserId.mockReset()
})

describe('GET /api/feedback (userList)', () => {
  it('returns user feedback when authenticated', async () => {
    const mockFeedback: FeedbackRow[] = [
      {
        id: 'fb_1',
        userId: 'test-user',
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
      },
    ]
    mockListByUserId.mockResolvedValue(mockFeedback)

    const res = await GET(new Request('http://localhost/api/feedback'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data).toEqual(mockFeedback)
    expect(body.message).toBe('Feedback retrieved')
    expect(mockListByUserId).toHaveBeenCalledWith('test-user')
  })

  it('returns empty array when user has no feedback', async () => {
    mockListByUserId.mockResolvedValue([])

    const res = await GET(new Request('http://localhost/api/feedback'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns 401 when userId is missing', async () => {
    jest.resetModules()
    jest.doMock('@/features/auth/server/requestAuth', () => {
      const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
      return mockRequestAuthModule({ userId: null })
    })

    // Re-import the handler with the modified mock
    const { GET: GET401 } = await import('@/features/feedback/api/routes/userList')

    const res = await GET401(new Request('http://localhost/api/feedback'))
    expect(res.status).toBe(401)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.message).toContain('Unauthorized')
  })
})

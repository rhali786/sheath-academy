/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ userId: 'test-user', email: 'parent@example.com' })
})

jest.mock('@/features/lib/server/appAdmin', () => ({
  isAppAdmin: jest.fn(),
}))

jest.mock('@/features/feedback/server/repository', () => ({
  listFeedbackByUserId: jest.fn(),
  listFeedbackForAdmin: jest.fn(),
}))

import { isAppAdmin } from '@/features/lib/server/appAdmin'
import { listFeedbackByUserId, listFeedbackForAdmin } from '@/features/feedback/server/repository'
import { GET } from '@/features/feedback/api/routes/userList'
import type { FeedbackRow } from '@/features/feedback/types'

const mockIsAppAdmin = isAppAdmin as jest.Mock
const mockListByUserId = listFeedbackByUserId as jest.Mock
const mockListForAdmin = listFeedbackForAdmin as jest.Mock

const makeRow = (overrides: Partial<FeedbackRow> = {}): FeedbackRow => ({
  id: 'fb_1',
  userId: 'test-user',
  householdId: 'hh_test',
  householdName: null,
  userEmail: 'parent@example.com',
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
  ...overrides,
})

beforeEach(() => {
  mockIsAppAdmin.mockReset()
  mockListByUserId.mockReset()
  mockListForAdmin.mockReset()
})

describe('GET /api/feedback (userList)', () => {
  describe('non-admin user', () => {
    beforeEach(() => {
      mockIsAppAdmin.mockReturnValue(false)
    })

    it('calls listFeedbackByUserId with the session userId', async () => {
      mockListByUserId.mockResolvedValue([makeRow()])
      const res = await GET(new Request('http://localhost/api/feedback'))
      expect(mockListByUserId).toHaveBeenCalledWith('test-user')
      expect(mockListForAdmin).not.toHaveBeenCalled()
    })

    it('returns 200 with the user rows', async () => {
      const rows = [makeRow()]
      mockListByUserId.mockResolvedValue(rows)
      const res = await GET(new Request('http://localhost/api/feedback'))
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.status).toBe('success')
      expect(body.data).toEqual(rows)
    })

    it('returns empty array when user has no feedback', async () => {
      mockListByUserId.mockResolvedValue([])
      const res = await GET(new Request('http://localhost/api/feedback'))
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.data).toEqual([])
    })
  })

  describe('admin user', () => {
    beforeEach(() => {
      mockIsAppAdmin.mockReturnValue(true)
    })

    it('calls listFeedbackForAdmin instead of listFeedbackByUserId', async () => {
      mockListForAdmin.mockResolvedValue([makeRow()])
      const res = await GET(new Request('http://localhost/api/feedback'))
      expect(mockListForAdmin).toHaveBeenCalled()
      expect(mockListByUserId).not.toHaveBeenCalled()
    })

    it('returns all feedback rows for admin', async () => {
      const rows = [
        makeRow({ id: 'fb_1', userEmail: 'parent@example.com' }),
        makeRow({ id: 'fb_2', userEmail: 'other@example.com', userId: 'user_2' }),
      ]
      mockListForAdmin.mockResolvedValue(rows)
      const res = await GET(new Request('http://localhost/api/feedback'))
      const body = await res.json()
      expect(res.status).toBe(200)
      expect(body.status).toBe('success')
      expect(body.data).toHaveLength(2)
    })
  })

  describe('unauthenticated', () => {
    it('returns 401 when userId is null', async () => {
      jest.resetModules()
      jest.doMock('@/features/auth/server/requestAuth', () => {
        const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
        return mockRequestAuthModule({ userId: null, email: null })
      })
      const { GET: GETFresh } = await import('@/features/feedback/api/routes/userList')
      const res = await GETFresh(new Request('http://localhost/api/feedback'))
      expect(res.status).toBe(401)
      const body = await res.json()
      expect(body.status).toBe('error')
      expect(body.message).toContain('Unauthorized')
    })
  })
})

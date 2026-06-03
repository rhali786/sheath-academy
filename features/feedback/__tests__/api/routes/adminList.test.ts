/** @jest-environment node */

jest.mock('@/features/lib/server/requireAdminApi', () => ({
  requireAdminApi: jest.fn(),
}))

jest.mock('@/features/feedback/server/repository', () => ({
  listFeedbackForAdmin: jest.fn(),
}))

import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import { listFeedbackForAdmin } from '@/features/feedback/server/repository'
import { GET } from '@/features/feedback/api/routes/adminList'
import type { FeedbackRow } from '@/features/feedback/types'

const mockRequireAdmin = requireAdminApi as jest.Mock
const mockListForAdmin = listFeedbackForAdmin as jest.Mock

const mockFeedback: FeedbackRow[] = [
  {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
    pagePath: '/dashboard',
    sentiment: 'good',
    message: 'Great feature',
    status: 'submitted',
    featureArea: 'dashboard',
    feedbackType: 'feature-request',
    riskLevel: 'low',
    confidence: 'high',
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

beforeEach(() => {
  mockRequireAdmin.mockReset()
  mockListForAdmin.mockReset()
})

describe('GET /api/admin/feedback (adminList)', () => {
  it('returns feedback for admin without filters', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue(mockFeedback)

    const res = await GET(new Request('http://localhost/api/admin/feedback'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data).toEqual(mockFeedback)
    expect(mockListForAdmin).toHaveBeenCalledWith({})
  })

  it('returns 403 when user is not admin', async () => {
    const forbiddenRes = new Response(
      JSON.stringify({ status: 'error', data: null, message: 'Forbidden', timestamp: new Date().toISOString() }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    )
    mockRequireAdmin.mockResolvedValue({ ok: false, response: forbiddenRes })

    const res = await GET(new Request('http://localhost/api/admin/feedback'))

    expect(res.status).toBe(403)
  })

  it('filters by status', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([mockFeedback[0]])

    const res = await GET(new Request('http://localhost/api/admin/feedback?status=submitted'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({ status: 'submitted' })
  })

  it('filters by confidence level', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([mockFeedback[0]])

    const res = await GET(new Request('http://localhost/api/admin/feedback?confidence=high'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({ confidence: 'high' })
  })

  it('filters by risk level', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([mockFeedback[0]])

    const res = await GET(new Request('http://localhost/api/admin/feedback?riskLevel=low'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({ riskLevel: 'low' })
  })

  it('filters by feedback type', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([mockFeedback[0]])

    const res = await GET(new Request('http://localhost/api/admin/feedback?feedbackType=feature-request'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({ feedbackType: 'feature-request' })
  })

  it('filters by feature area', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([mockFeedback[0]])

    const res = await GET(new Request('http://localhost/api/admin/feedback?featureArea=dashboard'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({ featureArea: 'dashboard' })
  })

  it('filters by PR number', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([])

    const res = await GET(new Request('http://localhost/api/admin/feedback?prNumber=123'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({ prNumber: 123 })
  })

  it('filters by hasDuplicate flag', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([])

    const res = await GET(new Request('http://localhost/api/admin/feedback?hasDuplicate=true'))
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({ hasDuplicate: true })
  })

  it('combines multiple filters', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockListForAdmin.mockResolvedValue([mockFeedback[0]])

    const res = await GET(
      new Request(
        'http://localhost/api/admin/feedback?status=submitted&confidence=high&featureArea=dashboard'
      )
    )
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(mockListForAdmin).toHaveBeenCalledWith({
      status: 'submitted',
      confidence: 'high',
      featureArea: 'dashboard',
    })
  })
})

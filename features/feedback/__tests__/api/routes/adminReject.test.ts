/** @jest-environment node */

jest.mock('@/features/lib/server/requireAdminApi', () => ({
  requireAdminApi: jest.fn(),
}))

jest.mock('@/features/feedback/server/service', () => ({
  rejectForPlanning: jest.fn(),
  FeedbackWorkflowError: class FeedbackWorkflowError extends Error {
    constructor(
      message: string,
      public readonly statusCode: number,
      public readonly code: string,
    ) {
      super(message)
      this.name = 'FeedbackWorkflowError'
    }
  },
}))

import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import { rejectForPlanning, FeedbackWorkflowError } from '@/features/feedback/server/service'
import { POST } from '@/features/feedback/api/routes/adminReject'

const mockRequireAdmin = requireAdminApi as jest.Mock
const mockReject = rejectForPlanning as jest.Mock

beforeEach(() => {
  mockRequireAdmin.mockReset()
  mockReject.mockReset()
})

describe('POST /api/admin/feedback/[id]/reject (adminReject)', () => {
  it('rejects feedback when admin', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockReject.mockResolvedValue(undefined)

    const res = await POST(new Request('http://localhost/api/admin/feedback/fb_1/reject', { method: 'POST' }), 'fb_1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.message).toBe('Feedback rejected')
    expect(mockReject).toHaveBeenCalledWith('fb_1')
  })

  it('returns 409 when feedback is already shipped', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockReject.mockRejectedValue(
      new FeedbackWorkflowError('Shipped feedback cannot be rejected', 409, 'invalid_feedback_state'),
    )

    const res = await POST(new Request('http://localhost/api/admin/feedback/fb_1/reject', { method: 'POST' }), 'fb_1')
    const body = await res.json()

    expect(res.status).toBe(409)
    expect(body.status).toBe('error')
    expect(body.message).toContain('Shipped feedback')
  })

  it('returns 403 when user is not admin', async () => {
    const forbiddenRes = new Response(
      JSON.stringify({ status: 'error', data: null, message: 'Forbidden', timestamp: new Date().toISOString() }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    )
    mockRequireAdmin.mockResolvedValue({ ok: false, response: forbiddenRes })

    const res = await POST(new Request('http://localhost/api/admin/feedback/fb_1/reject', { method: 'POST' }), 'fb_1')

    expect(res.status).toBe(403)
    expect(mockReject).not.toHaveBeenCalled()
  })

  it('returns 400 when feedback ID is missing', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })

    const res = await POST(new Request('http://localhost/api/admin/feedback//reject', { method: 'POST' }), '')

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.message).toContain('Feedback ID required')
    expect(mockReject).not.toHaveBeenCalled()
  })
})

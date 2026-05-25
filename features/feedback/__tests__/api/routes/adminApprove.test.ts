/** @jest-environment node */

jest.mock('@/features/lib/server/requireAdminApi', () => ({
  requireAdminApi: jest.fn(),
}))

jest.mock('@/features/feedback/server/repository', () => ({
  approveFeedback: jest.fn(),
}))

import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import { approveFeedback } from '@/features/feedback/server/repository'
import { POST } from '@/features/feedback/api/routes/adminApprove'

const mockRequireAdmin = requireAdminApi as jest.Mock
const mockApprove = approveFeedback as jest.Mock

beforeEach(() => {
  mockRequireAdmin.mockReset()
  mockApprove.mockReset()
})

describe('POST /api/admin/feedback/[id]/approve (adminApprove)', () => {
  it('approves feedback when admin', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })
    mockApprove.mockResolvedValue(undefined)

    const res = await POST(new Request('http://localhost/api/admin/feedback/fb_1/approve', { method: 'POST' }), 'fb_1')
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.message).toBe('Feedback approved')
    expect(mockApprove).toHaveBeenCalledWith('fb_1', 'admin@example.com')
  })

  it('returns 403 when user is not admin', async () => {
    const forbiddenRes = new Response(
      JSON.stringify({ status: 'error', data: null, message: 'Forbidden', timestamp: new Date().toISOString() }),
      { status: 403, headers: { 'content-type': 'application/json' } }
    )
    mockRequireAdmin.mockResolvedValue({ ok: false, response: forbiddenRes })

    const res = await POST(new Request('http://localhost/api/admin/feedback/fb_1/approve', { method: 'POST' }), 'fb_1')

    expect(res.status).toBe(403)
    expect(mockApprove).not.toHaveBeenCalled()
  })

  it('returns 400 when feedback ID is missing', async () => {
    mockRequireAdmin.mockResolvedValue({ ok: true, email: 'admin@example.com' })

    const res = await POST(new Request('http://localhost/api/admin/feedback//approve', { method: 'POST' }), '')

    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.message).toContain('Feedback ID required')
    expect(mockApprove).not.toHaveBeenCalled()
  })
})

/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ userId: 'user_1', householdId: 'hh_1', email: 'parent@example.com' })
})

jest.mock('@/features/feedback/server/repository', () => ({
  insertFeedback: jest.fn(),
  MAX_FEEDBACK_SCREENSHOT_BYTES: 2 * 1024 * 1024,
  ALLOWED_FEEDBACK_SCREENSHOT_MIME_TYPES: new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']),
}))

import { insertFeedback } from '@/features/feedback/server/repository'
import { POST } from '@/features/feedback/api/routes/submit'

const mockInsert = insertFeedback as jest.Mock

function makeRequest(body: unknown): Request {
  return new Request('http://localhost/api/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockInsert.mockReset()
  mockInsert.mockResolvedValue(undefined)
})

describe('POST /api/feedback (submit) — screenshot handling', () => {
  it('persists feedback with no screenshot as before', async () => {
    const res = await POST(makeRequest({ pagePath: '/dashboard', sentiment: 'good' }))
    expect(res.status).toBe(200)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ screenshotData: null, screenshotMimeType: undefined }),
    )
  })

  it('decodes a base64 screenshot and passes it to the repository', async () => {
    const base64 = Buffer.from('fake-image-bytes').toString('base64')
    const res = await POST(
      makeRequest({ pagePath: '/dashboard', sentiment: 'good', screenshot: base64, screenshotMimeType: 'image/png' }),
    )
    expect(res.status).toBe(200)
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        screenshotMimeType: 'image/png',
        screenshotData: Buffer.from('fake-image-bytes'),
      }),
    )
  })

  it('rejects a screenshot over the size cap with a clear error and does not call the repository', async () => {
    const oversized = Buffer.alloc(2 * 1024 * 1024 + 1).toString('base64')
    const res = await POST(
      makeRequest({ pagePath: '/dashboard', sentiment: 'good', screenshot: oversized, screenshotMimeType: 'image/png' }),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(body.message).toMatch(/too large/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects a disallowed screenshot MIME type', async () => {
    const res = await POST(
      makeRequest({
        pagePath: '/dashboard',
        sentiment: 'good',
        screenshot: Buffer.from('x').toString('base64'),
        screenshotMimeType: 'application/pdf',
      }),
    )
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.message).toMatch(/must be one of/i)
    expect(mockInsert).not.toHaveBeenCalled()
  })

  it('rejects screenshot without a mime type', async () => {
    const res = await POST(
      makeRequest({ pagePath: '/dashboard', sentiment: 'good', screenshot: Buffer.from('x').toString('base64') }),
    )
    expect(res.status).toBe(400)
    expect(mockInsert).not.toHaveBeenCalled()
  })
})

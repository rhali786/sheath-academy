/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ userId: 'user_1', email: 'parent@example.com' })
})

jest.mock('@/features/lib/server/appAdmin', () => ({
  isAppAdmin: jest.fn((email: string) => email === 'admin@example.com'),
}))

jest.mock('@/features/feedback/server/repository', () => ({
  getFeedbackScreenshot: jest.fn(),
}))

import { getFeedbackScreenshot } from '@/features/feedback/server/repository'
import { GET } from '@/features/feedback/api/routes/screenshot'

const mockGetScreenshot = getFeedbackScreenshot as jest.Mock

beforeEach(() => {
  mockGetScreenshot.mockReset()
})

describe('GET /api/feedback/[id]/screenshot', () => {
  it('serves the raw bytes with the stored content type when the user owns the feedback', async () => {
    mockGetScreenshot.mockResolvedValue({ data: Buffer.from('fake-image-bytes'), mimeType: 'image/png', userId: 'user_1' })

    const res = await GET(new Request('http://localhost/api/feedback/fb_1/screenshot'), 'fb_1')

    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    const buf = Buffer.from(await res.arrayBuffer())
    expect(buf.toString()).toBe('fake-image-bytes')
  })

  it('returns 404 when there is no screenshot', async () => {
    mockGetScreenshot.mockResolvedValue(null)
    const res = await GET(new Request('http://localhost/api/feedback/fb_1/screenshot'), 'fb_1')
    expect(res.status).toBe(404)
  })

  it('returns 403 when the requester is neither the owner nor an admin', async () => {
    mockGetScreenshot.mockResolvedValue({ data: Buffer.from('x'), mimeType: 'image/png', userId: 'someone-else' })
    const res = await GET(new Request('http://localhost/api/feedback/fb_1/screenshot'), 'fb_1')
    expect(res.status).toBe(403)
  })
})

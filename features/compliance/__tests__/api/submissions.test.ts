/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/compliance/server/repository', () => ({
  listSubmissions: jest.fn(),
  createSubmission: jest.fn(),
  updateSubmissionStatus: jest.fn(),
  deleteSubmission: jest.fn(),
}))

import { createSubmission, updateSubmissionStatus, deleteSubmission } from '@/features/compliance/server/repository'
import { POST } from '@/features/compliance/api/routes/submissions'
import { PATCH, DELETE } from '@/features/compliance/api/routes/submissions-id'

const mockCreate = createSubmission as jest.Mock
const mockUpdate = updateSubmissionStatus as jest.Mock
const mockDelete = deleteSubmission as jest.Mock

function makeSubmission(overrides: Record<string, unknown> = {}) {
  return {
    id: 'submission_1', householdId: 'hh_test', schoolYearId: 'sy1',
    status: 'drafted', submittedAt: null, acceptedAt: null, snapshotJson: null,
    ...overrides,
  }
}

function jsonReq(method: string, body: unknown) {
  return new Request('http://localhost/api/compliance/submissions', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => { mockCreate.mockReset(); mockUpdate.mockReset(); mockDelete.mockReset() })

describe('POST /api/compliance/submissions', () => {
  it('returns 400 when schoolYearId missing', async () => {
    const res = await POST(jsonReq('POST', {}))
    expect(res.status).toBe(400)
  })

  it('returns 400 for an invalid status', async () => {
    const res = await POST(jsonReq('POST', { schoolYearId: 'sy1', status: 'bogus' }))
    expect(res.status).toBe(400)
  })

  it('creates a submission and returns 201', async () => {
    mockCreate.mockResolvedValue(makeSubmission())
    const res = await POST(jsonReq('POST', { schoolYearId: 'sy1' }))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith('hh_test', expect.objectContaining({ schoolYearId: 'sy1' }))
  })
})

describe('PATCH /api/compliance/submissions/:id', () => {
  it('returns 400 for an invalid status', async () => {
    const res = await PATCH('submission_1', jsonReq('PATCH', { status: 'bogus' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when the submission does not exist', async () => {
    mockUpdate.mockResolvedValue(null)
    const res = await PATCH('nope', jsonReq('PATCH', { status: 'sent' }))
    expect(res.status).toBe(404)
  })

  it('advances status to sent and stamps submittedAt', async () => {
    mockUpdate.mockResolvedValue(makeSubmission({ status: 'sent', submittedAt: new Date().toISOString() }))
    const res = await PATCH('submission_1', jsonReq('PATCH', { status: 'sent' }))
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.data.status).toBe('sent')
    expect(mockUpdate).toHaveBeenCalledWith('submission_1', 'hh_test', 'sent', expect.objectContaining({ submittedAt: expect.any(Date) }))
  })
})

describe('DELETE /api/compliance/submissions/:id', () => {
  it('returns 404 when nothing removed', async () => {
    mockDelete.mockResolvedValue(false)
    const res = await DELETE('nope')
    expect(res.status).toBe(404)
  })

  it('deletes a submission', async () => {
    mockDelete.mockResolvedValue(true)
    const res = await DELETE('submission_1')
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith('submission_1', 'hh_test')
  })
})

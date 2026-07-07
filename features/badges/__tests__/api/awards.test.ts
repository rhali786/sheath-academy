/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/badges/server/repository', () => ({
  createAward: jest.fn(),
  updateAwardStatus: jest.fn(),
  deleteAward: jest.fn(),
  addEvidenceToAward: jest.fn(),
  removeEvidenceFromAward: jest.fn(),
}))

import {
  createAward,
  updateAwardStatus,
  deleteAward,
  addEvidenceToAward,
  removeEvidenceFromAward,
} from '@/features/badges/server/repository'
import { POST } from '@/features/badges/api/routes/awards'
import { PATCH, DELETE } from '@/features/badges/api/routes/awards-id'
import { POST as POST_EVIDENCE, DELETE as DELETE_EVIDENCE } from '@/features/badges/api/routes/awards-evidence'

const mockCreate = createAward as jest.Mock
const mockUpdate = updateAwardStatus as jest.Mock
const mockDelete = deleteAward as jest.Mock
const mockAddEvidence = addEvidenceToAward as jest.Mock
const mockRemoveEvidence = removeEvidenceFromAward as jest.Mock

function makeAward(overrides: Record<string, unknown> = {}) {
  return {
    id: 'award_1', householdId: 'hh_test', learnerId: 'l1', badgeId: 'b1',
    status: 'draft', submittedAt: null, verifiedAt: null, approvedAt: null,
    evidenceIds: [], evidence: [], ...overrides,
  }
}

function jsonReq(method: string, body: unknown) {
  return new Request('http://localhost/api/badges/awards', {
    method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  })
}

beforeEach(() => {
  mockCreate.mockReset(); mockUpdate.mockReset(); mockDelete.mockReset()
  mockAddEvidence.mockReset(); mockRemoveEvidence.mockReset()
})

describe('POST /api/badges/awards', () => {
  it('returns 400 when learnerId/badgeId missing', async () => {
    const res = await POST(jsonReq('POST', { learnerId: 'l1' }))
    expect(res.status).toBe(400)
    expect(mockCreate).not.toHaveBeenCalled()
  })

  it('creates a draft award and returns 201', async () => {
    mockCreate.mockResolvedValue(makeAward())
    const res = await POST(jsonReq('POST', { learnerId: 'l1', badgeId: 'b1' }))
    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith('hh_test', { learnerId: 'l1', badgeId: 'b1', status: 'draft' })
  })
})

describe('PATCH /api/badges/awards/:id', () => {
  it('returns 400 for an invalid transition', async () => {
    const res = await PATCH('award_1', jsonReq('PATCH', { status: 'bogus' }))
    expect(res.status).toBe(400)
  })

  it('returns 404 when award not found', async () => {
    mockUpdate.mockResolvedValue(null)
    const res = await PATCH('nope', jsonReq('PATCH', { status: 'submitted' }))
    expect(res.status).toBe(404)
  })

  it('advances to submitted and stamps submittedAt', async () => {
    mockUpdate.mockResolvedValue(makeAward({ status: 'submitted', submittedAt: new Date().toISOString() }))
    const res = await PATCH('award_1', jsonReq('PATCH', { status: 'submitted' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith('award_1', 'hh_test', 'submitted', expect.objectContaining({ submittedAt: expect.any(Date) }))
  })

  it('approves by stamping approvedAt on a verified award', async () => {
    mockUpdate.mockResolvedValue(makeAward({ status: 'verified', approvedAt: new Date().toISOString() }))
    const res = await PATCH('award_1', jsonReq('PATCH', { status: 'approved' }))
    expect(res.status).toBe(200)
    expect(mockUpdate).toHaveBeenCalledWith('award_1', 'hh_test', 'verified', expect.objectContaining({ approvedAt: expect.any(Date) }))
  })
})

describe('DELETE /api/badges/awards/:id', () => {
  it('returns 404 when nothing removed', async () => {
    mockDelete.mockResolvedValue(false)
    const res = await DELETE('nope')
    expect(res.status).toBe(404)
  })

  it('revokes an award', async () => {
    mockDelete.mockResolvedValue(true)
    const res = await DELETE('award_1')
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledWith('award_1', 'hh_test')
  })
})

describe('POST /api/badges/awards/:id/evidence', () => {
  it('returns 400 when evidenceId missing', async () => {
    const res = await POST_EVIDENCE('award_1', jsonReq('POST', {}))
    expect(res.status).toBe(400)
  })

  it('links evidence and returns 201 (closes the previously-dangling call)', async () => {
    mockAddEvidence.mockResolvedValue({ id: 'bae_1', householdId: 'hh_test', badgeAwardId: 'award_1', evidenceId: 'ev_1', addedAt: '' })
    const res = await POST_EVIDENCE('award_1', jsonReq('POST', { evidenceId: 'ev_1' }))
    expect(res.status).toBe(201)
    expect(mockAddEvidence).toHaveBeenCalledWith('hh_test', { badgeAwardId: 'award_1', evidenceId: 'ev_1' })
  })
})

describe('DELETE /api/badges/awards/:id/evidence/:linkId', () => {
  it('returns 404 when link not found', async () => {
    mockRemoveEvidence.mockResolvedValue(false)
    const res = await DELETE_EVIDENCE('award_1', 'bae_nope')
    expect(res.status).toBe(404)
  })

  it('unlinks evidence', async () => {
    mockRemoveEvidence.mockResolvedValue(true)
    const res = await DELETE_EVIDENCE('award_1', 'bae_1')
    expect(res.status).toBe(200)
    expect(mockRemoveEvidence).toHaveBeenCalledWith('bae_1', 'hh_test')
  })
})

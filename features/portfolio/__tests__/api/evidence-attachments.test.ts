/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/portfolio/server/repository', () => ({
  getEvidenceRow: jest.fn(),
}))

jest.mock('@/features/portfolio/server/attachments-repository', () => ({
  insertEvidenceAttachment: jest.fn(),
  getEvidenceAttachment: jest.fn(),
  deleteEvidenceAttachment: jest.fn(),
}))

import { getEvidenceRow } from '@/features/portfolio/server/repository'
import {
  insertEvidenceAttachment,
  getEvidenceAttachment,
  deleteEvidenceAttachment,
} from '@/features/portfolio/server/attachments-repository'
import {
  POST as postAttachment,
  GET as getAttachmentRoute,
  DELETE as deleteAttachmentRoute,
} from '@/features/portfolio/api/routes/evidence-attachments'

const mockGetEvidence = getEvidenceRow as jest.Mock
const mockInsert = insertEvidenceAttachment as jest.Mock
const mockGetAttachment = getEvidenceAttachment as jest.Mock
const mockDelete = deleteEvidenceAttachment as jest.Mock

const FAKE_EVIDENCE_ROW = {
  id: 'evidence_001',
  householdId: 'hh_test',
  learnerId: 'learner_001',
  title: 'Test',
  evidenceType: 'note',
  evidenceDate: '2026-06-09',
  createdAt: new Date(),
  updatedAt: new Date(),
}

const FAKE_ATTACHMENT_ROW = {
  id: 'patt_001',
  evidenceItemId: 'evidence_001',
  filename: 'photo.png',
  mimeType: 'image/png',
  sizeBytes: 512,
  data: Buffer.from('fake png'),
  createdAt: new Date(),
}

const FAKE_ATTACHMENT_META = {
  id: 'patt_001',
  evidenceItemId: 'evidence_001',
  filename: 'photo.png',
  mimeType: 'image/png',
  sizeBytes: 512,
  createdAt: new Date().toISOString(),
}

beforeEach(() => {
  mockGetEvidence.mockReset()
  mockInsert.mockReset()
  mockGetAttachment.mockReset()
  mockDelete.mockReset()
})

// ── POST /api/portfolio/evidence/:id/attachments ───────────────────────────────

describe('POST /api/portfolio/evidence/:id/attachments', () => {
  function makeFormDataRequest(evidenceId: string, file: File | null) {
    const fd = new FormData()
    if (file) fd.append('file', file)
    return new Request(`http://localhost/api/portfolio/evidence/${evidenceId}/attachments`, {
      method: 'POST',
      body: fd,
    })
  }

  it('returns 404 when evidence item not found or wrong household', async () => {
    mockGetEvidence.mockResolvedValue(null)
    const file = new File(['data'], 'photo.png', { type: 'image/png' })
    const res = await postAttachment('evidence_missing', makeFormDataRequest('evidence_missing', file))
    expect(res.status).toBe(404)
  })

  it('returns 400 when no file in form data', async () => {
    mockGetEvidence.mockResolvedValue(FAKE_EVIDENCE_ROW)
    const res = await postAttachment('evidence_001', makeFormDataRequest('evidence_001', null))
    expect(res.status).toBe(400)
  })

  it('returns 400 when file is oversized (simulated by insertEvidenceAttachment rejection)', async () => {
    mockGetEvidence.mockResolvedValue(FAKE_EVIDENCE_ROW)
    mockInsert.mockRejectedValue(new Error('Attachment size 9999999 exceeds limit'))
    const file = new File(['x'.repeat(100)], 'big.png', { type: 'image/png' })
    const res = await postAttachment('evidence_001', makeFormDataRequest('evidence_001', file))
    expect(res.status).toBe(400)
  })

  it('returns 400 when MIME type is disallowed', async () => {
    mockGetEvidence.mockResolvedValue(FAKE_EVIDENCE_ROW)
    mockInsert.mockRejectedValue(new Error('MIME type text/plain is not allowed'))
    const file = new File(['data'], 'notes.txt', { type: 'text/plain' })
    const res = await postAttachment('evidence_001', makeFormDataRequest('evidence_001', file))
    expect(res.status).toBe(400)
  })

  it('persists attachment and returns EvidenceAttachmentMeta (no bytes)', async () => {
    mockGetEvidence.mockResolvedValue(FAKE_EVIDENCE_ROW)
    mockInsert.mockResolvedValue(FAKE_ATTACHMENT_ROW)
    const file = new File([Buffer.from('fake png')], 'photo.png', { type: 'image/png' })
    const res = await postAttachment('evidence_001', makeFormDataRequest('evidence_001', file))
    expect(res.status).toBe(201)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toMatchObject({
      id: 'patt_001',
      filename: 'photo.png',
      mimeType: 'image/png',
    })
    // must NOT include bytes
    expect(body.data.data).toBeUndefined()
  })
})

// ── GET /api/portfolio/evidence/attachments/:attachmentId ─────────────────────

describe('GET /api/portfolio/evidence/attachments/:attachmentId', () => {
  it('returns 404 when attachment not found', async () => {
    mockGetAttachment.mockResolvedValue(null)
    const res = await getAttachmentRoute('patt_missing')
    expect(res.status).toBe(404)
  })

  it('returns 404 when owning evidence belongs to a different household', async () => {
    mockGetAttachment.mockResolvedValue({ ...FAKE_ATTACHMENT_ROW, evidenceItemId: 'evidence_001' })
    mockGetEvidence.mockResolvedValue(null) // null = not found for this household
    const res = await getAttachmentRoute('patt_001')
    expect(res.status).toBe(404)
  })

  it('serves bytes with correct Content-Type and Content-Disposition', async () => {
    mockGetAttachment.mockResolvedValue(FAKE_ATTACHMENT_ROW)
    mockGetEvidence.mockResolvedValue(FAKE_EVIDENCE_ROW)
    const res = await getAttachmentRoute('patt_001')
    expect(res.status).toBe(200)
    expect(res.headers.get('Content-Type')).toBe('image/png')
    expect(res.headers.get('Content-Disposition')).toContain('photo.png')
  })
})

// ── DELETE /api/portfolio/evidence/attachments/:attachmentId ──────────────────

describe('DELETE /api/portfolio/evidence/attachments/:attachmentId', () => {
  it('returns 404 when attachment not found', async () => {
    mockGetAttachment.mockResolvedValue(null)
    const res = await deleteAttachmentRoute('patt_missing')
    expect(res.status).toBe(404)
  })

  it('returns 404 when owning evidence belongs to a different household', async () => {
    mockGetAttachment.mockResolvedValue(FAKE_ATTACHMENT_ROW)
    mockGetEvidence.mockResolvedValue(null)
    const res = await deleteAttachmentRoute('patt_001')
    expect(res.status).toBe(404)
  })

  it('deletes and returns success', async () => {
    mockGetAttachment.mockResolvedValue(FAKE_ATTACHMENT_ROW)
    mockGetEvidence.mockResolvedValue(FAKE_EVIDENCE_ROW)
    mockDelete.mockResolvedValue(true)
    const res = await deleteAttachmentRoute('patt_001')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(mockDelete).toHaveBeenCalledWith('patt_001')
  })
})

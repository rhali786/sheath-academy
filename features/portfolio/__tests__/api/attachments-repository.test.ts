/** @jest-environment node */

const hasDb = !!process.env.DATABASE_URL
const itDb = hasDb ? it : it.skip

import {
  insertEvidenceAttachment,
  getEvidenceAttachment,
  listEvidenceAttachments,
  deleteEvidenceAttachment,
} from '../../server/attachments-repository'
import { createEvidenceRow } from '../../server/repository'
import { createTestHousehold } from '@/features/lib/__tests__/fixtures/testDb'

let householdId: string
let learnerId: string
let evidenceItemId: string
let cleanup: () => Promise<void>

// Minimal valid 1x1 PNG
const VALID_PNG = Buffer.from(
  '89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000a' +
  '49444154789c6260000000000200011c4bb7440000000049454e44ae426082',
  'hex',
)

beforeAll(async () => {
  if (!hasDb) return
  const fixtures = await createTestHousehold('portfolio-attach')
  householdId = fixtures.household.id
  learnerId = fixtures.learner.id

  const evidenceRow = await createEvidenceRow(householdId, {
    learnerId,
    title: 'Attachment test evidence',
    evidenceType: 'work_sample',
    evidenceDate: '2026-06-09',
  })
  evidenceItemId = evidenceRow.id

  cleanup = async () => {
    const { getDb, closeDb } = await import('@/features/lib/server/db')
    const { portfolioEvidence } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    // portfolioEvidenceAttachments cascade-deletes from portfolioEvidence
    await getDb().delete(portfolioEvidence).where(eq(portfolioEvidence.householdId, householdId))
    await fixtures.cleanup()
    await closeDb()
  }
})

afterAll(async () => {
  if (hasDb) await cleanup?.()
})

// ── 1. insertEvidenceAttachment — validation ───────────────────────────────────

describe('insertEvidenceAttachment — validation', () => {
  itDb('rejects file over 2MB (MAX_EVIDENCE_ATTACHMENT_BYTES)', async () => {
    const bigBuffer = Buffer.alloc(2_097_153) // 2MB + 1 byte
    await expect(
      insertEvidenceAttachment({
        evidenceItemId,
        filename: 'big.png',
        mimeType: 'image/png',
        data: bigBuffer,
      }),
    ).rejects.toThrow(/size/i)
  })

  itDb('rejects disallowed MIME type', async () => {
    const buf = Buffer.from('fake data')
    await expect(
      insertEvidenceAttachment({
        evidenceItemId,
        filename: 'bad.txt',
        mimeType: 'text/plain',
        data: buf,
      }),
    ).rejects.toThrow(/mime/i)
  })

  itDb('rejects application/zip', async () => {
    const buf = Buffer.from('PK\x03\x04')
    await expect(
      insertEvidenceAttachment({
        evidenceItemId,
        filename: 'archive.zip',
        mimeType: 'application/zip',
        data: buf,
      }),
    ).rejects.toThrow(/mime/i)
  })
})

// ── 2. Round-trip — image/png ─────────────────────────────────────────────────

describe('insertEvidenceAttachment — round-trip', () => {
  let attachmentId: string

  itDb('inserts a valid image/png attachment', async () => {
    const row = await insertEvidenceAttachment({
      evidenceItemId,
      filename: 'test.png',
      mimeType: 'image/png',
      data: VALID_PNG,
    })
    attachmentId = row.id
    expect(row.id).toBeTruthy()
    expect(row.evidenceItemId).toBe(evidenceItemId)
    expect(row.filename).toBe('test.png')
    expect(row.mimeType).toBe('image/png')
    expect(row.sizeBytes).toBe(VALID_PNG.length)
  })

  itDb('getEvidenceAttachment returns the row including bytes', async () => {
    const fetched = await getEvidenceAttachment(attachmentId)
    expect(fetched).not.toBeNull()
    expect(fetched!.data).toEqual(VALID_PNG)
    expect(fetched!.mimeType).toBe('image/png')
    expect(fetched!.filename).toBe('test.png')
  })

  itDb('listEvidenceAttachments returns metadata rows for the evidence item', async () => {
    const rows = await listEvidenceAttachments(evidenceItemId)
    expect(rows.some(r => r.id === attachmentId)).toBe(true)
    // list must not include the data bytes (metadata only)
    const found = rows.find(r => r.id === attachmentId)
    expect(found).not.toHaveProperty('data')
  })

  itDb('deleteEvidenceAttachment removes the row', async () => {
    const deleted = await deleteEvidenceAttachment(attachmentId)
    expect(deleted).toBe(true)
    const fetched = await getEvidenceAttachment(attachmentId)
    expect(fetched).toBeNull()
  })
})

// ── 3. application/pdf allowed ────────────────────────────────────────────────

describe('insertEvidenceAttachment — PDF allowed', () => {
  itDb('accepts application/pdf', async () => {
    const pdfBytes = Buffer.from('%PDF-1.4 fake pdf content')
    const row = await insertEvidenceAttachment({
      evidenceItemId,
      filename: 'essay.pdf',
      mimeType: 'application/pdf',
      data: pdfBytes,
    })
    expect(row.id).toBeTruthy()
    expect(row.mimeType).toBe('application/pdf')
    // cleanup: delete it
    await deleteEvidenceAttachment(row.id)
  })
})

// ── 4. getEvidenceAttachment — missing ID returns null ────────────────────────

describe('getEvidenceAttachment', () => {
  itDb('returns null for unknown id', async () => {
    const result = await getEvidenceAttachment('att_does_not_exist')
    expect(result).toBeNull()
  })
})

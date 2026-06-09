import { eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { portfolioEvidenceAttachments } from '@/db/schema'
import type { EvidenceAttachmentMeta } from '../types'

export const MAX_EVIDENCE_ATTACHMENT_BYTES = 2_097_152 // 2 MB

const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'application/pdf',
])

type AttachmentRow = typeof portfolioEvidenceAttachments.$inferSelect

function newId() {
  return `patt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export async function insertEvidenceAttachment(params: {
  evidenceItemId: string
  filename: string
  mimeType: string
  data: Buffer
}): Promise<AttachmentRow> {
  if (params.data.length > MAX_EVIDENCE_ATTACHMENT_BYTES) {
    throw new Error(
      `Attachment size ${params.data.length} exceeds limit of ${MAX_EVIDENCE_ATTACHMENT_BYTES} bytes`,
    )
  }
  if (!ALLOWED_MIME_TYPES.has(params.mimeType)) {
    throw new Error(`MIME type ${params.mimeType} is not allowed`)
  }

  const db = getDb()
  const now = new Date()
  const [row] = await db
    .insert(portfolioEvidenceAttachments)
    .values({
      id: newId(),
      evidenceItemId: params.evidenceItemId,
      filename: params.filename,
      mimeType: params.mimeType,
      sizeBytes: params.data.length,
      data: params.data,
      createdAt: now,
    })
    .returning()
  return row
}

export async function getEvidenceAttachment(attachmentId: string): Promise<AttachmentRow | null> {
  const db = getDb()
  const rows = await db
    .select()
    .from(portfolioEvidenceAttachments)
    .where(eq(portfolioEvidenceAttachments.id, attachmentId))
    .limit(1)
  return rows[0] ?? null
}

export async function listEvidenceAttachments(
  evidenceItemId: string,
): Promise<EvidenceAttachmentMeta[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: portfolioEvidenceAttachments.id,
      evidenceItemId: portfolioEvidenceAttachments.evidenceItemId,
      filename: portfolioEvidenceAttachments.filename,
      mimeType: portfolioEvidenceAttachments.mimeType,
      sizeBytes: portfolioEvidenceAttachments.sizeBytes,
      createdAt: portfolioEvidenceAttachments.createdAt,
    })
    .from(portfolioEvidenceAttachments)
    .where(eq(portfolioEvidenceAttachments.evidenceItemId, evidenceItemId))
  return rows.map((r) => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
  }))
}

export async function deleteEvidenceAttachment(attachmentId: string): Promise<boolean> {
  const db = getDb()
  const result = await db
    .delete(portfolioEvidenceAttachments)
    .where(eq(portfolioEvidenceAttachments.id, attachmentId))
    .returning()
  return result.length > 0
}

import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { EvidenceAttachmentMeta } from '@/features/portfolio/types'
import { getEvidenceRow } from '@/features/portfolio/server/repository'
import {
  insertEvidenceAttachment,
  getEvidenceAttachment,
  deleteEvidenceAttachment,
} from '@/features/portfolio/server/attachments-repository'

function metaFromRow(row: {
  id: string
  evidenceItemId: string
  filename: string
  mimeType: string
  sizeBytes: number
  createdAt: Date
}): EvidenceAttachmentMeta {
  return {
    id: row.id,
    evidenceItemId: row.evidenceItemId,
    filename: row.filename,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    createdAt: row.createdAt.toISOString(),
  }
}

export async function POST(
  evidenceId: string,
  request: Request,
): Promise<NextResponse<ApiResponse<EvidenceAttachmentMeta | null>> | Response> {
  try {
    const { householdId } = getRequestAuthCtx()
    const evidenceRow = await getEvidenceRow(evidenceId, householdId)
    if (!evidenceRow) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'Evidence item not found', timestamp: new Date().toISOString() },
        { status: 404 },
      )
    }

    const formData = await request.formData()
    const file = formData.get('file')
    if (!(file instanceof File)) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'A file field is required', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    const data = Buffer.from(arrayBuffer)

    const row = await insertEvidenceAttachment({
      evidenceItemId: evidenceId,
      filename: file.name,
      mimeType: file.type,
      data,
    })

    return NextResponse.json(
      { status: 'success', data: metaFromRow(row), message: 'Attachment uploaded', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload failed'
    const isValidation = /size|mime/i.test(message)
    return NextResponse.json(
      { status: 'error', data: null, message, timestamp: new Date().toISOString() },
      { status: isValidation ? 400 : 500 },
    )
  }
}

export async function GET(
  attachmentId: string,
): Promise<Response> {
  try {
    const { householdId } = getRequestAuthCtx()
    const attachment = await getEvidenceAttachment(attachmentId)
    if (!attachment) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'Attachment not found', timestamp: new Date().toISOString() },
        { status: 404 },
      )
    }

    const owningEvidence = await getEvidenceRow(attachment.evidenceItemId, householdId)
    if (!owningEvidence) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'Attachment not found', timestamp: new Date().toISOString() },
        { status: 404 },
      )
    }

    return new Response(new Uint8Array(attachment.data), {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': `inline; filename="${attachment.filename}"`,
      },
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Attachment not found', timestamp: new Date().toISOString() },
      { status: 404 },
    )
  }
}

export async function DELETE(
  attachmentId: string,
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const attachment = await getEvidenceAttachment(attachmentId)
    if (!attachment) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'Attachment not found', timestamp: new Date().toISOString() },
        { status: 404 },
      )
    }

    const owningEvidence = await getEvidenceRow(attachment.evidenceItemId, householdId)
    if (!owningEvidence) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'Attachment not found', timestamp: new Date().toISOString() },
        { status: 404 },
      )
    }

    await deleteEvidenceAttachment(attachmentId)
    return NextResponse.json(
      { status: 'success', data: null, message: 'Attachment deleted', timestamp: new Date().toISOString() },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Attachment not found', timestamp: new Date().toISOString() },
      { status: 404 },
    )
  }
}

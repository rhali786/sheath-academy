import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { EvidenceItem, EvidenceType } from '@/features/portfolio/types'
import { getEvidenceRow, updateEvidenceRow, deleteEvidenceRow } from '@/features/portfolio/server/repository'
import type { EvidenceRow } from '@/features/portfolio/server/repository'
import { listEvidenceAttachments } from '@/features/portfolio/server/attachments-repository'
import type { EvidenceAttachmentMeta } from '@/features/portfolio/types'

function rowToEvidence(r: EvidenceRow, attachments: EvidenceAttachmentMeta[] = []): EvidenceItem {
  const item: EvidenceItem = {
    id: r.id,
    title: r.title,
    childId: r.learnerId,
    subjectId: r.subjectId ?? '',
    date: r.evidenceDate,
    type: r.evidenceType as EvidenceType,
    createdBy: 'user',
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  }
  if (r.description !== null) item.notes = r.description
  if (r.url !== null) item.url = r.url
  if (r.lessonTaskId !== null) item.lessonTaskId = r.lessonTaskId
  item.attachments = attachments
  return item
}

export async function GET(id: string): Promise<NextResponse<ApiResponse<EvidenceItem | null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const row = await getEvidenceRow(id, householdId)
    if (!row) return NextResponse.json({ status: 'error', data: null, message: 'Evidence item not found', timestamp: new Date().toISOString() }, { status: 404 })
    const attachments = await listEvidenceAttachments(id)
    return NextResponse.json({ status: 'success', data: rowToEvidence(row, attachments), message: 'Evidence item retrieved', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Evidence item not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function PUT(id: string, request: Request): Promise<NextResponse<ApiResponse<EvidenceItem | null>>> {
  const body = await request.json()
  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateEvidenceRow(id, householdId, { title: body.title?.trim(), description: body.notes, url: body.url, evidenceDate: body.date, evidenceType: body.type })
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Evidence item not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToEvidence(updated), message: 'Evidence item updated', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Evidence item not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await deleteEvidenceRow(id, householdId)
    if (!removed) return NextResponse.json({ status: 'error', data: null, message: 'Evidence item not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Evidence item deleted', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Evidence item not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

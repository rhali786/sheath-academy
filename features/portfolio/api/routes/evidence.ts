import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { EvidenceItem, EvidenceType } from '@/features/portfolio/types'
import { listEvidenceRows, createEvidenceRow } from '@/features/portfolio/server/repository'
import type { EvidenceRow } from '@/features/portfolio/server/repository'
import { guardOwnership, assertSessionOwnership, sessionAuthCtx } from '@/features/auth/server/routeOwnership'
import { getHouseholdContext } from '@/features/lib/server/tenant'

function rowToEvidence(r: EvidenceRow): EvidenceItem {
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
  return item
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<EvidenceItem[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const subjectId = url.searchParams.get('subjectId') ?? undefined
  const lessonTaskId = url.searchParams.get('lessonTaskId') ?? undefined
  const type = (url.searchParams.get('type') ?? undefined) as EvidenceType | undefined
  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined

  try {
    const { householdId } = await getHouseholdContext()
    const rows = await listEvidenceRows(householdId, { learnerId: childId, subjectId, lessonTaskId, startDate, endDate })
    const filtered = type ? rows.filter(r => r.evidenceType === type) : rows
    return NextResponse.json({ status: 'success', data: filtered.map(rowToEvidence), message: 'Evidence items retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: [], message: 'Evidence items retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<EvidenceItem | null>>> {
  const body = await request.json()

  return guardOwnership(async () => {
    const { childId, title, type, date, subjectId, lessonTaskId, notes, url } = body
    if (!childId || !title?.trim() || !type || !date) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'childId, title, type, and date are required', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }
    await assertSessionOwnership('learner', childId)
    const { householdId, userId } = await sessionAuthCtx()
    const row = await createEvidenceRow(householdId, {
      learnerId: childId,
      title: title.trim(),
      evidenceType: type,
      evidenceDate: date,
      subjectId,
      lessonTaskId,
      description: notes,
      url,
    })
    const { trackEvidenceCreated } = await import('@/features/admin-metrics/server/instrument')
    void trackEvidenceCreated(userId, householdId, childId, row.id)
    return NextResponse.json(
      { status: 'success', data: rowToEvidence(row), message: 'Evidence item created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  }) as Promise<NextResponse<ApiResponse<EvidenceItem | null>>>
}

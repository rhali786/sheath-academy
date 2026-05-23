import { NextResponse } from 'next/server'
import type { ApiResponse, QuranSession } from '@/features/lib/types'
import { listQuranSessionRows, createQuranSessionRow, updateQuranSessionRow, deleteQuranSessionRow } from '@/features/quran/server/repository'
import type { QuranSessionRow } from '@/features/quran/server/repository'
import { guardOwnership, assertSessionOwnership, sessionAuthCtx } from '@/features/auth/server/routeOwnership'
import { getHouseholdContext } from '@/features/lib/server/tenant'

function rowToSession(r: QuranSessionRow): QuranSession {
  return {
    id: r.id, childId: r.learnerId, type: r.sessionType,
    surah: r.surah ?? '', fromAyah: r.fromAyah ?? 0, toAyah: r.toAyah ?? 0,
    notes: r.notes ?? '', date: r.sessionDate, lastLogged: r.sessionDate,
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined

  try {
    const { householdId } = await getHouseholdContext()
    const rows = await listQuranSessionRows(householdId, { learnerId: childId })
    const sessions = rows.map(rowToSession)
    return NextResponse.json({ status: 'success', data: { sessions, chartData: [] }, message: 'Quran sessions retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: { sessions: [], chartData: [] }, message: 'Quran sessions retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const sessionData = await request.json()

  return guardOwnership(async () => {
    await assertSessionOwnership('learner', sessionData.childId)
    const { householdId, userId } = await sessionAuthCtx()
    const today = new Date().toISOString().split('T')[0]
    const row = await createQuranSessionRow(householdId, {
      learnerId: sessionData.childId,
      sessionDate: today,
      sessionType: sessionData.type,
      surah: sessionData.surah,
      fromAyah: sessionData.fromAyah,
      toAyah: sessionData.toAyah,
      notes: sessionData.notes,
    })
    const { trackQuranRecord } = await import('@/features/admin-metrics/server/instrument')
    void trackQuranRecord(userId, householdId, sessionData.childId, row.id)
    return NextResponse.json(
      { status: 'success', data: rowToSession(row), message: 'Quran session added', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  })
}

export async function PATCH(request: Request, context: { id: string }): Promise<NextResponse> {
  const { id } = context
  const patch = await request.json()

  try {
    const { householdId } = await getHouseholdContext()
    const updated = await updateQuranSessionRow(id, householdId, patch)
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToSession(updated), message: 'Quran session updated', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function DELETE(_request: Request, context: { id: string }): Promise<NextResponse> {
  const { id } = context

  try {
    const { householdId } = await getHouseholdContext()
    const removed = await deleteQuranSessionRow(id, householdId)
    if (!removed) return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Quran session deleted', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

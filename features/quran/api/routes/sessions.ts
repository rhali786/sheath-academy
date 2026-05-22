import { NextResponse } from 'next/server'
import type { ApiResponse, ChartSeries, QuranSessionRequest, QuranSession } from '@/features/lib/types'
import { getQuranSessions, addQuranSession, updateQuranSession, deleteQuranSession } from '@/features/quran/server/service'
import { getStudentProfiles } from '@/features/children/server/service'
import { listQuranSessionRows, createQuranSessionRow, updateQuranSessionRow, deleteQuranSessionRow } from '@/features/quran/server/repository'
import type { QuranSessionRow } from '@/features/quran/server/repository'
import { isPostgresMode } from '@/features/lib/server/db'
import { guardOwnership, assertSessionOwnership, sessionAuthCtx } from '@/features/auth/server/routeOwnership'
import { getHouseholdContext } from '@/features/lib/server/tenant'

const CHILD_COLORS: Record<string, string> = { student_seed_adam_001: '#3b82f6', student_seed_khadijah_001: '#ec4899', student_seed_zayd_001: '#8b5cf6' }
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function rowToSession(r: QuranSessionRow): QuranSession {
  return {
    id: r.id, childId: r.learnerId, type: r.sessionType,
    surah: r.surah ?? '', fromAyah: r.fromAyah ?? 0, toAyah: r.toAyah ?? 0,
    notes: r.notes ?? '', date: r.sessionDate, lastLogged: r.sessionDate,
  }
}

function buildChartData(sessions: ReturnType<typeof getQuranSessions>, childId: string, name: string): ChartSeries {
  const dayCount: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 }
  sessions.filter(s => s.childId === childId).forEach(session => {
    const dayName = DAYS[new Date(session.date).getDay()]
    if (dayName && dayName !== 'Sun' && dayName !== 'Sat') { dayCount[dayName] = (dayCount[dayName] || 0) + 1 }
  })
  return { id: name, color: CHILD_COLORS[childId] || '#6b7280', data: [{ x: 'Mon', y: dayCount['Mon'] }, { x: 'Tue', y: dayCount['Tue'] }, { x: 'Wed', y: dayCount['Wed'] }, { x: 'Thu', y: dayCount['Thu'] }, { x: 'Fri', y: dayCount['Fri'] }] }
}

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined

  if (isPostgresMode()) {
    try {
      const { householdId } = await getHouseholdContext()
      const rows = await listQuranSessionRows(householdId, { learnerId: childId })
      const sessions = rows.map(rowToSession)
      return NextResponse.json({ status: 'success', data: { sessions, chartData: [] }, message: 'Quran sessions retrieved', timestamp: new Date().toISOString() })
    } catch {
      return NextResponse.json({ status: 'success', data: { sessions: [], chartData: [] }, message: 'Quran sessions retrieved', timestamp: new Date().toISOString() })
    }
  }

  const allSessions = getQuranSessions()
  const activeProfiles = getStudentProfiles().filter(p => p.isActive)
  const profilesToShow = childId ? activeProfiles.filter(p => p.id === childId) : activeProfiles
  const chartData: ChartSeries[] = profilesToShow.map(p => buildChartData(allSessions, p.id, p.name))
  const sessions = getQuranSessions(childId).filter(s => !childId ? activeProfiles.some(p => p.id === s.childId) : true)
  return NextResponse.json({ status: 'success', data: { sessions, chartData }, message: 'Quran sessions retrieved', timestamp: new Date().toISOString() })
}

export async function POST(request: Request): Promise<NextResponse> {
  const sessionData = (await request.json()) as QuranSessionRequest

  if (isPostgresMode()) {
    return guardOwnership(async () => {
      await assertSessionOwnership('learner', sessionData.childId)
      const { householdId } = await sessionAuthCtx()
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
      const ctx = await sessionAuthCtx()
      const { trackQuranRecord } = await import('@/features/admin-metrics/server/instrument')
      void trackQuranRecord(ctx.userId, householdId, sessionData.childId, row.id)
      return NextResponse.json(
        { status: 'success', data: rowToSession(row), message: 'Quran session added', timestamp: new Date().toISOString() },
        { status: 201 },
      )
    })
  }

  const newSession = addQuranSession(sessionData)
  return NextResponse.json({ status: 'success', data: newSession, message: 'Quran session added', timestamp: new Date().toISOString() }, { status: 201 })
}

export async function PATCH(request: Request, context: { id: string }): Promise<NextResponse> {
  const { id } = context
  const patch = await request.json()

  if (isPostgresMode()) {
    try {
      const { householdId } = await getHouseholdContext()
      const updated = await updateQuranSessionRow(id, householdId, patch)
      if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 })
      return NextResponse.json({ status: 'success', data: rowToSession(updated), message: 'Quran session updated', timestamp: new Date().toISOString() })
    } catch { return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 }) }
  }

  const updated = updateQuranSession(id, patch)
  if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 })
  return NextResponse.json({ status: 'success', data: updated, message: 'Quran session updated', timestamp: new Date().toISOString() })
}

export async function DELETE(_request: Request, context: { id: string }): Promise<NextResponse> {
  const { id } = context

  if (isPostgresMode()) {
    try {
      const { householdId } = await getHouseholdContext()
      const removed = await deleteQuranSessionRow(id, householdId)
      if (!removed) return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 })
      return NextResponse.json({ status: 'success', data: null, message: 'Quran session deleted', timestamp: new Date().toISOString() })
    } catch { return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 }) }
  }

  const removed = deleteQuranSession(id)
  if (!removed) return NextResponse.json({ status: 'error', data: null, message: 'Session not found', timestamp: new Date().toISOString() }, { status: 404 })
  return NextResponse.json({ status: 'success', data: null, message: 'Quran session deleted', timestamp: new Date().toISOString() })
}

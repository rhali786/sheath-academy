import { NextResponse } from 'next/server'
import type { ApiResponse, ChartSeries, QuranSessionRequest, QuranSession } from '@/features/lib/types'
import { listQuranSessionRows, createQuranSessionRow } from '@/features/quran/server/repository'
import { listLearners } from '@/features/children/server/repository'
import { guardOwnership, assertSessionOwnership, sessionAuthCtx } from '@/features/auth/server/routeOwnership'
import { getHouseholdContext } from '@/features/lib/server/tenant'

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const

function buildChartData(sessions: QuranSession[], childId: string, name: string, color: string): ChartSeries {
  const dayCount: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0 }
  sessions.filter(s => s.childId === childId).forEach(s => {
    const dayName = DAYS[new Date(s.date + 'T12:00:00Z').getUTCDay()]
    if (dayName && dayName !== 'Sun' && dayName !== 'Sat') dayCount[dayName] = (dayCount[dayName] || 0) + 1
  })
  return { id: name, color, data: Object.entries(dayCount).map(([x, y]) => ({ x, y })) }
}

const LEARNER_COLORS = ['#3b82f6', '#ec4899', '#8b5cf6', '#10b981', '#f59e0b']

export async function GET(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined

  try {
    const { householdId } = await getHouseholdContext()
    const rows = await listQuranSessionRows(householdId, { learnerId: childId })
    const sessions: QuranSession[] = rows.map(r => ({
      id: r.id, childId: r.learnerId, type: r.sessionType,
      surah: r.surah ?? '', fromAyah: r.fromAyah ?? 0, toAyah: r.toAyah ?? 0,
      notes: r.notes ?? '', date: r.sessionDate, lastLogged: r.sessionDate,
    }))

    const learners = childId ? [{ id: childId, name: childId }] : await listLearners(householdId)
    const chartData: ChartSeries[] = learners.map((l, i) =>
      buildChartData(sessions, l.id, l.name, LEARNER_COLORS[i % LEARNER_COLORS.length]),
    )

    return NextResponse.json({ status: 'success', data: { sessions, chartData }, message: 'Quran sessions retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'success', data: { sessions: [], chartData: [] }, message: 'Quran sessions retrieved', timestamp: new Date().toISOString() })
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const sessionData = (await request.json()) as QuranSessionRequest

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
    const session: QuranSession = {
      id: row.id, childId: row.learnerId, type: row.sessionType,
      surah: row.surah ?? '', fromAyah: row.fromAyah ?? 0, toAyah: row.toAyah ?? 0,
      notes: row.notes ?? '', date: row.sessionDate, lastLogged: row.sessionDate,
    }
    return NextResponse.json({ status: 'success', data: session, message: 'Quran session added', timestamp: new Date().toISOString() }, { status: 201 })
  })
}

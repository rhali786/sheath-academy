import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardMetrics } from '@/features/lib/types'
import { getAlerts } from '@/features/alerts/server/service'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listQuranSessionRows } from '@/features/quran/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listLearners } from '@/features/children/server/repository'
import { toDateString } from '@/features/lib/server/date'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<DashboardMetrics>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined

  try {
    const { householdId, timezone } = getRequestAuthCtx()
    const today = toDateString(new Date(), timezone ?? 'America/New_York')

    const [activeLearners, todayAttendance, todayLessons, todayQuran, portfolioRows, alerts] =
      await Promise.all([
        listLearners(householdId),
        listAttendanceEvents(householdId, { learnerId: childId, date: today }),
        listLessonTaskRows(householdId, { learnerId: childId, startDate: today, endDate: today }),
        listQuranSessionRows(householdId, { learnerId: childId, startDate: today, endDate: today }),
        listEvidenceRows(householdId, { learnerId: childId }),
        getAlerts(householdId, childId),
      ])

    const totalChildren = childId ? 1 : activeLearners.length
    const readyCount = todayAttendance.filter(r => r.status === 'present' || r.status === 'partial').length
    const openAlerts = alerts.filter(a => a.status === 'open')

    const metrics: DashboardMetrics = {
      attendanceReady: totalChildren > 0 ? `${readyCount}/${totalChildren}` : '0/0',
      lessonsPlanned: todayLessons.length,
      needsAttention: openAlerts.length,
      quranLogged: todayQuran.length > 0
        ? `${todayQuran.length} session${todayQuran.length !== 1 ? 's' : ''}`
        : 'None today',
      portfolioItems: portfolioRows.length,
    }

    return NextResponse.json({ status: 'success', data: metrics, message: 'Dashboard summary retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json(
      { status: 'error', data: { attendanceReady: '0/0', lessonsPlanned: 0, needsAttention: 0, quranLogged: 'None today', portfolioItems: 0 }, message: 'Failed to load dashboard', timestamp: new Date().toISOString() },
      { status: 500 }
    )
  }
}

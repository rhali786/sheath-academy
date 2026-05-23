import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardMetrics } from '@/features/lib/types'
import { getAlerts } from '@/features/alerts/server/service'
import { getHouseholdContext } from '@/features/lib/server/tenant'
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
    const { householdId, timezone } = await getHouseholdContext()
    const today = toDateString(new Date(), timezone)

    const activeLearners = await listLearners(householdId)
    const totalChildren = childId ? 1 : activeLearners.length

    const todayAttendance = await listAttendanceEvents(householdId, { learnerId: childId, date: today })
    const readyCount = todayAttendance.filter(r => r.status === 'present' || r.status === 'partial').length

    const todayLessons = await listLessonTaskRows(householdId, { learnerId: childId, startDate: today, endDate: today })
    const todayQuran = await listQuranSessionRows(householdId, { learnerId: childId, startDate: today, endDate: today })
    const portfolioRows = await listEvidenceRows(householdId, { learnerId: childId })

    const alerts = (await getAlerts(householdId, childId)).filter(a => a.status === 'open')

    const metrics: DashboardMetrics = {
      attendanceReady: totalChildren > 0 ? `${readyCount}/${totalChildren}` : '0/0',
      lessonsPlanned: todayLessons.length,
      needsAttention: alerts.length,
      quranLogged: todayQuran.length > 0
        ? `${todayQuran.length} session${todayQuran.length !== 1 ? 's' : ''}`
        : 'None today',
      portfolioItems: portfolioRows.length,
    }

    return NextResponse.json({ status: 'success', data: metrics, message: 'Dashboard summary retrieved', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: { attendanceReady: '0/0', lessonsPlanned: 0, needsAttention: 0, quranLogged: 'None today', portfolioItems: 0 }, message: 'Failed to load dashboard', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardMetrics } from '@/features/lib/types'
import { getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { getLessons } from '@/features/plan/server/service'
import { getQuranSessions } from '@/features/quran/server/service'
import { getAlerts } from '@/features/alerts/server/service'
import { listEvidenceItems } from '@/features/portfolio/server/service'
import { getStudentProfiles } from '@/features/children/server/service'
import { isPostgresMode } from '@/features/lib/server/db'
import { getHouseholdContext } from '@/features/lib/server/tenant'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listQuranSessionRows } from '@/features/quran/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listLearners } from '@/features/children/server/repository'
import { toDateString } from '@/features/lib/server/date'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<DashboardMetrics>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined

  if (isPostgresMode()) {
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

      // Alerts still use memory-based service until Phase 8 DB-backs alerts
      const alerts = getAlerts(childId).filter(a => a.status === 'open')
      const needsAttention = alerts.length

      const metrics: DashboardMetrics = {
        attendanceReady: totalChildren > 0 ? `${readyCount}/${totalChildren}` : '0/0',
        lessonsPlanned: todayLessons.length,
        needsAttention,
        quranLogged: todayQuran.length > 0
          ? `${todayQuran.length} session${todayQuran.length !== 1 ? 's' : ''}`
          : 'None today',
        portfolioItems: portfolioRows.length,
      }

      return NextResponse.json({ status: 'success', data: metrics, message: 'Dashboard summary retrieved', timestamp: new Date().toISOString() })
    } catch {
      // Fall through to memory path on auth/DB error
    }
  }

  // Memory path
  const today = todayLocal()
  const allProfiles = getStudentProfiles()
  const archivedIds = new Set(allProfiles.filter(p => !p.isActive).map(p => p.id))
  const activeChildren = allProfiles.filter(p => p.isActive)
  const totalChildren = childId ? 1 : activeChildren.length

  const todayAttendance = getAttendanceRecords({ childId, date: today })
  const readyCount = todayAttendance.filter(r => r.status === 'present' || r.status === 'partial').length
  const todayLessons = getLessons(childId).filter(l => l.dueDate === today)
  const allQuranToday = getQuranSessions().filter(s => s.date === today)
  const todayQuran = childId ? allQuranToday.filter(s => s.childId === childId) : allQuranToday.filter(s => !archivedIds.has(s.childId))
  const portfolioCount = listEvidenceItems({ childId }).length
  const relevantAlerts = getAlerts(childId).filter(a => a.status === 'open').filter(a => childId ? a.childId === childId : (a.childId === null || !archivedIds.has(a.childId ?? '')))

  return NextResponse.json({
    status: 'success',
    data: {
      attendanceReady: totalChildren > 0 ? `${readyCount}/${totalChildren}` : '0/0',
      lessonsPlanned: todayLessons.length,
      needsAttention: relevantAlerts.length,
      quranLogged: todayQuran.length > 0 ? `${todayQuran.length} session${todayQuran.length !== 1 ? 's' : ''}` : 'None today',
      portfolioItems: portfolioCount,
    },
    message: 'Dashboard summary retrieved',
    timestamp: new Date().toISOString(),
  })
}

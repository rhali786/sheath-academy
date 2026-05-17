import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardMetrics } from '@/features/lib/types'
import { getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { getLessons } from '@/features/planner/server/service'
import { getQuranSessions } from '@/features/quran/server/service'
import { getAlerts } from '@/features/alerts/server/service'
import { listEvidenceItems } from '@/features/portfolio/server/service'
import { getStudentProfiles } from '@/features/children/server/service'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<DashboardMetrics>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined
  const today = todayLocal()

  const allProfiles = getStudentProfiles()
  const archivedIds = new Set(allProfiles.filter(p => !p.isActive).map(p => p.id))
  const activeChildren = allProfiles.filter(p => p.isActive)
  const totalChildren = childId ? 1 : activeChildren.length

  const todayAttendance = getAttendanceRecords({ childId, date: today })
  const readyCount = todayAttendance.filter(r => r.status === 'present' || r.status === 'partial').length

  const todayLessons = getLessons(childId).filter(l => l.dueDate === today)

  const allQuranToday = getQuranSessions().filter(s => s.date === today)
  const todayQuran = childId
    ? allQuranToday.filter(s => s.childId === childId)
    : allQuranToday.filter(s => !archivedIds.has(s.childId))

  const portfolioCount = listEvidenceItems({ childId }).length

  const relevantAlerts = getAlerts(childId)
    .filter(a => a.status === 'open')
    .filter(a => childId ? a.childId === childId : (a.childId === null || !archivedIds.has(a.childId ?? '')))
  const needsAttention = relevantAlerts.length

  const metrics: DashboardMetrics = {
    attendanceReady: totalChildren > 0 ? `${readyCount}/${totalChildren}` : '0/0',
    lessonsPlanned: todayLessons.length,
    needsAttention,
    quranLogged: todayQuran.length > 0
      ? `${todayQuran.length} session${todayQuran.length !== 1 ? 's' : ''}`
      : 'None today',
    portfolioItems: portfolioCount,
  }

  return NextResponse.json({
    status: 'success',
    data: metrics,
    message: 'Dashboard summary retrieved',
    timestamp: new Date().toISOString(),
  })
}

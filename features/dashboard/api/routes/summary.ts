import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardMetrics } from '@/features/lib/types'
import { getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { getLessons } from '@/features/planner/server/service'
import { getQuranSessions } from '@/features/dashboard/server/service'
import { listEvidenceItems } from '@/features/portfolio/server/service'
import { getStudentProfiles } from '@/features/children/server/service'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function GET(): Promise<NextResponse<ApiResponse<DashboardMetrics>>> {
  const today = todayLocal()

  const activeChildren = getStudentProfiles().filter(p => p.isActive)
  const totalChildren = activeChildren.length

  const todayAttendance = getAttendanceRecords({ date: today })
  const readyCount = todayAttendance.filter(r => r.status === 'present' || r.status === 'partial').length

  const todayLessons = getLessons().filter(l => l.dueDate === today)

  const todayQuran = getQuranSessions().filter(s => s.date === today)

  const portfolioCount = listEvidenceItems().length

  const metrics: DashboardMetrics = {
    attendanceReady: totalChildren > 0 ? `${readyCount}/${totalChildren}` : '0/0',
    lessonsPlanned: todayLessons.length,
    needsAttention: 0,
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

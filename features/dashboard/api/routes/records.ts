import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardRecord } from '@/features/lib/types'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listQuranSessionRows } from '@/features/quran/server/repository'
import { listLearners } from '@/features/children/server/repository'

function getCurrentWeekRange(): { start: string; end: string } {
  const today = new Date()
  const dow = today.getDay()
  const daysFromMonday = dow === 0 ? 6 : dow - 1
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
  const sunday = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + 6)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  return { start: fmt(monday), end: fmt(sunday) }
}

function weekdayCount(start: string, end: string): number {
  const s = new Date(`${start}T00:00:00Z`)
  const e = new Date(`${end}T00:00:00Z`)
  let count = 0
  const cur = new Date(s)
  while (cur <= e) {
    const day = cur.getUTCDay()
    if (day !== 0 && day !== 6) count++
    cur.setUTCDate(cur.getUTCDate() + 1)
  }
  return count
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<DashboardRecord[]>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined
  const { start, end } = getCurrentWeekRange()

  try {
    const { householdId } = getRequestAuthCtx()
    const activeLearners = await listLearners(householdId)
    const maxAttendance = childId ? weekdayCount(start, end) : activeLearners.length * weekdayCount(start, end)

    const weekAttendance = await listAttendanceEvents(householdId, { learnerId: childId, startDate: start, endDate: end })
    const weekLessons = await listLessonTaskRows(householdId, { learnerId: childId, startDate: start, endDate: end })
    const completedLessons = weekLessons.filter(l => l.status === 'completed')
    const weekEvidence = await listEvidenceRows(householdId, { learnerId: childId, startDate: start, endDate: end })
    const weekQuran = await listQuranSessionRows(householdId, { learnerId: childId, startDate: start, endDate: end })

    return NextResponse.json({
      status: 'success',
      data: [
        { id: 'record_attendance', title: 'Attendance', count: weekAttendance.length, maxCount: maxAttendance > 0 ? maxAttendance : undefined, icon: 'CheckCircle', viewButton: 'View' },
        { id: 'record_progress', title: 'Progress updates', count: completedLessons.length, maxCount: weekLessons.length > 0 ? weekLessons.length : undefined, icon: 'TrendingUp', viewButton: 'View' },
        { id: 'record_portfolio', title: 'Portfolio evidence', count: weekEvidence.length, icon: 'Folder', viewButton: 'View' },
        { id: 'record_quran', title: 'Quran sessions', count: weekQuran.length, icon: 'BookOpen', viewButton: 'View' },
      ],
      message: 'Records retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json({ status: 'error', data: [], message: 'Failed to load records', timestamp: new Date().toISOString() }, { status: 500 })
  }
}

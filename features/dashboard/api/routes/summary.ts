import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse, DashboardMetrics } from '@/features/lib/types'
import { getAlerts } from '@/features/alerts/server/service'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listLessonTaskRows, type LessonTaskRow } from '@/features/plan/server/repository'
import { listQuranSessionRows } from '@/features/quran/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listLearners } from '@/features/children/server/repository'
import { toDateString, toTimeString } from '@/features/lib/server/date'
import { computeTaskMetrics } from '@/features/dashboard/server/taskMetrics'
import type { LessonTask } from '@/features/plan/types'

const EMPTY_METRICS: DashboardMetrics = {
  attendanceReady: '0/0',
  lessonsPlanned: 0,
  needsAttention: 0,
  quranLogged: 'None today',
  portfolioItems: 0,
  tasksCompleted: 0,
  tasksInProgress: 0,
  tasksOverdue: 0,
}

function rowToLessonTask(row: LessonTaskRow): LessonTask {
  return {
    id: row.id,
    childId: row.learnerId,
    subjectId: row.subjectId ?? '',
    householdId: row.householdId,
    title: row.title,
    description: row.description ?? undefined,
    dueDate: row.dueDate ?? '',
    status: (row.status as LessonTask['status']) ?? 'not_started',
    order: row.sortOrder,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(request: Request): Promise<NextResponse<ApiResponse<DashboardMetrics>>> {
  const { searchParams } = new URL(request.url)
  const childId = searchParams.get('childId') || undefined

  try {
    const { householdId, timezone } = getRequestAuthCtx()
    const tz = timezone ?? 'America/New_York'
    const now = new Date()
    const today = toDateString(now, tz)
    const currentTime = toTimeString(now, tz)

    const [activeLearners, todayAttendance, todayLessonRows, overdueLessonRows, todayQuran, portfolioRows, alerts] =
      await Promise.all([
        listLearners(householdId),
        listAttendanceEvents(householdId, { learnerId: childId, date: today }),
        listLessonTaskRows(householdId, { learnerId: childId, startDate: today, endDate: today }),
        listLessonTaskRows(householdId, { learnerId: childId, endDate: today }),
        listQuranSessionRows(householdId, { learnerId: childId, startDate: today, endDate: today }),
        listEvidenceRows(householdId, { learnerId: childId }),
        getAlerts(householdId, childId),
      ])

    const totalChildren = childId ? 1 : activeLearners.length
    const readyCount = todayAttendance.filter(r => r.status === 'present' || r.status === 'partial').length
    const openAlerts = alerts.filter(a => a.status === 'open')
    const todayLessons = todayLessonRows.map(rowToLessonTask)
    const overdueLessons = overdueLessonRows.map(rowToLessonTask)

    const taskCounts = computeTaskMetrics({
      today,
      currentTime,
      todayLessons,
      overdueLessons,
      attendanceMarkedCount: readyCount,
      quranSessionCount: todayQuran.length,
    })

    const metrics: DashboardMetrics = {
      attendanceReady: totalChildren > 0 ? `${readyCount}/${totalChildren}` : '0/0',
      lessonsPlanned: todayLessons.length,
      needsAttention: openAlerts.length,
      quranLogged: todayQuran.length > 0
        ? `${todayQuran.length} session${todayQuran.length !== 1 ? 's' : ''}`
        : 'None today',
      portfolioItems: portfolioRows.length,
      ...taskCounts,
    }

    return NextResponse.json({
      status: 'success',
      data: metrics,
      message: 'Dashboard summary retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        data: EMPTY_METRICS,
        message: 'Failed to load dashboard',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

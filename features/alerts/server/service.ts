import type { Alert } from '@/features/alerts/types'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listAllLearners } from '@/features/children/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listGradebookSummaries } from '@/features/gradebook/server/repository'
import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { listDeadlines } from '@/features/compliance/server/repository'
import { tryGetRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { getHouseholdLocalDate } from '@/features/lib/server/date'

/**
 * How many days ahead a not-completed compliance deadline is considered
 * "due soon" and surfaced as an Attention Hub alert. Anything further out is
 * omitted; anything not-completed on or before this horizon (including overdue)
 * is surfaced.
 */
const COMPLIANCE_DUE_SOON_DAYS = 14

/** Adds `days` to a yyyy-mm-dd string in UTC (tz-agnostic calendar math). */
function addDaysIso(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(Date.UTC(y, m - 1, d))
  dt.setUTCDate(dt.getUTCDate() + days)
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`
}

/**
 * "Today" for alert purposes, computed in the HOUSEHOLD timezone — not the
 * server process timezone. AttendancePage submits attendanceDate in the
 * household's local timezone, so the attendance_missing query must match on the
 * same calendar day or a just-logged record is never matched and the alert never
 * clears (feedback 9937be68). Falls back to server-local only when no request
 * auth context / timezone is available.
 */
function todayLocal(): string {
  const timezone = tryGetRequestAuthCtx()?.timezone
  if (timezone) {
    try {
      return getHouseholdLocalDate(timezone)
    } catch {
      // Invalid timezone string — fall through to server-local below.
    }
  }
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getAlerts(householdId: string, childId?: string): Promise<Alert[]> {
  const today = todayLocal()
  const allProfiles = await listAllLearners(householdId)
  const activeChildren = allProfiles.filter(p => p.isActive)
  const targetChildren = childId ? activeChildren.filter(c => c.id === childId) : activeChildren
  const now = new Date().toISOString()

  // Fetch attendance, all per-child lesson batches, gradebook summaries, and the
  // active school year in parallel.
  const [todayAttendance, lessonsByChild, gradebookSummaries, activeSchoolYear] = await Promise.all([
    listAttendanceEvents(householdId, { date: today }),
    Promise.all(
      targetChildren.map(child =>
        listLessonTaskRows(householdId, { learnerId: child.id, endDate: today })
      )
    ),
    listGradebookSummaries(householdId),
    getActiveSchoolYear(householdId),
  ])

  const alerts: Alert[] = []
  const targetChildIds = new Set(targetChildren.map(c => c.id))

  targetChildren.forEach((child, i) => {
    const lessons = lessonsByChild[i]
    const pendingLessons = lessons.filter(
      lesson => lesson.dueDate !== null && lesson.status !== 'completed',
    )
    if (pendingLessons.length > 0) {
      const overdue = pendingLessons.filter(l => l.dueDate && l.dueDate < today)
      const message = overdue.length > 0
        ? `${overdue.length} overdue: ${overdue.map(l => l.title).slice(0, 2).join(', ')}`
        : `Due today: ${pendingLessons.map(l => l.title).slice(0, 2).join(', ')}`
      alerts.push({
        id: `pending_lessons_${child.id}`,
        childId: child.id,
        childName: child.name,
        href: `/lessons?childId=${child.id}`,
        date: today,
        type: 'pending_lessons',
        status: 'open',
        severity: overdue.length > 0 ? 'high' : 'medium',
        title: `${pendingLessons.length} lesson${pendingLessons.length !== 1 ? 's' : ''} not completed`,
        message,
        sourceFeature: 'planner',
        sourceId: child.id,
        createdAt: now,
      })
    }

    // Schedule imbalance: a subject scheduled >=2x on today for one learner.
    const todaysCountBySubject = new Map<string, number>()
    for (const lesson of lessons) {
      if (lesson.dueDate === today && lesson.subjectId) {
        todaysCountBySubject.set(lesson.subjectId, (todaysCountBySubject.get(lesson.subjectId) ?? 0) + 1)
      }
    }
    for (const [subjectId, count] of todaysCountBySubject) {
      if (count >= 2) {
        alerts.push({
          id: `schedule_imbalance_${child.id}_${subjectId}`,
          childId: child.id,
          childName: child.name,
          href: `/lessons?childId=${child.id}`,
          date: today,
          type: 'schedule_imbalance',
          status: 'open',
          severity: 'low',
          title: 'Course scheduled multiple times today',
          message: `${count} lessons for one course are scheduled today`,
          sourceFeature: 'planner',
          sourceId: subjectId,
          createdAt: now,
        })
      }
    }
  })

  // Gradebook: one alert per subject flagged as needing attention for a target learner.
  for (const summary of gradebookSummaries) {
    if (!targetChildIds.has(summary.learnerId)) continue
    for (const subjectId of summary.needsAttentionSubjects) {
      const label = summary.subjects.find(s => s.subjectId === subjectId)?.label ?? 'A course'
      alerts.push({
        id: `gradebook_attention_${summary.learnerId}_${subjectId}`,
        childId: summary.learnerId,
        childName: summary.learnerName,
        href: `/growth/gradebook?childId=${summary.learnerId}`,
        date: today,
        type: 'gradebook_needs_attention',
        status: 'open',
        severity: 'medium',
        title: `${label} needs attention`,
        message: `${label} needs review or has no recent scores`,
        sourceFeature: 'gradebook',
        sourceId: subjectId,
        createdAt: now,
      })
    }
  }

  // Compliance: household-scoped deadlines due within the due-soon window. Only
  // surfaced on the unfiltered (household) view, mirroring the attendance alert.
  if (!childId && activeSchoolYear) {
    const dueSoonHorizon = addDaysIso(today, COMPLIANCE_DUE_SOON_DAYS)
    const deadlines = await listDeadlines(householdId, activeSchoolYear.id)
    for (const deadline of deadlines) {
      if (deadline.isCompleted) continue
      if (deadline.dueDate > dueSoonHorizon) continue
      alerts.push({
        id: `compliance_deadline_${deadline.id}`,
        childId: null,
        href: '/compliance',
        date: deadline.dueDate,
        type: 'compliance_deadline',
        status: 'open',
        severity: 'medium',
        title: 'Compliance deadline approaching',
        message: `${deadline.label} is due ${deadline.dueDate}`,
        sourceFeature: 'compliance',
        sourceId: deadline.id,
        createdAt: now,
      })
    }
  }

  const childIdsWithAttendance = new Set(todayAttendance.map(r => r.learnerId))

  if (!childId) {
    const missingAttendance = activeChildren.filter(c => !childIdsWithAttendance.has(c.id))
    if (missingAttendance.length > 0) {
      alerts.push({
        id: `attendance_missing_${today}`,
        childId: null,
        href: '/attendance',
        date: today,
        type: 'attendance_missing',
        status: 'open',
        severity: 'medium',
        title: 'Attendance not logged today',
        message: `Missing for: ${missingAttendance.map(c => c.name).join(', ')}`,
        sourceFeature: 'attendance',
        createdAt: now,
      })
    }
  } else {
    if (!childIdsWithAttendance.has(childId)) {
      const child = activeChildren.find(c => c.id === childId)
      if (child) {
        alerts.push({
          id: `attendance_missing_${today}`,
          childId,
          childName: child.name,
          href: `/attendance?childId=${childId}`,
          date: today,
          type: 'attendance_missing',
          status: 'open',
          severity: 'medium',
          title: 'Attendance not logged today',
          message: `Missing for: ${child.name}`,
          sourceFeature: 'attendance',
          createdAt: now,
        })
      }
    }
  }

  return alerts
}

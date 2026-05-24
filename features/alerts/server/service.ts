import type { Alert } from '@/features/alerts/types'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listAllLearners } from '@/features/children/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export async function getAlerts(householdId: string, childId?: string): Promise<Alert[]> {
  const today = todayLocal()
  const allProfiles = await listAllLearners(householdId)
  const activeChildren = allProfiles.filter(p => p.isActive)
  const targetChildren = childId ? activeChildren.filter(c => c.id === childId) : activeChildren
  const now = new Date().toISOString()

  // Fetch attendance and all per-child lesson batches in parallel
  const [todayAttendance, lessonsByChild] = await Promise.all([
    listAttendanceEvents(householdId, { date: today }),
    Promise.all(
      targetChildren.map(child =>
        listLessonTaskRows(householdId, { learnerId: child.id, endDate: today })
      )
    ),
  ])

  const alerts: Alert[] = []

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
  })

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

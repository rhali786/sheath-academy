import type { Alert } from '@/features/alerts/types'
import { getLessons } from '@/features/planner/server/service'
import { getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { getStudentProfiles } from '@/features/children/server/service'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getAlerts(childId?: string): Alert[] {
  const today = todayLocal()
  const allProfiles = getStudentProfiles()
  const activeChildren = allProfiles.filter(p => p.isActive)
  const targetChildren = childId ? activeChildren.filter(c => c.id === childId) : activeChildren
  const alerts: Alert[] = []
  const now = new Date().toISOString()

  for (const child of targetChildren) {
    const pendingLessons = getLessons(child.id).filter(
      l => l.dueDate <= today && l.status !== 'completed'
    )
    if (pendingLessons.length > 0) {
      const overdue = pendingLessons.filter(l => l.dueDate < today)
      const message = overdue.length > 0
        ? `${overdue.length} overdue: ${overdue.map(l => l.title).slice(0, 2).join(', ')}`
        : `Due today: ${pendingLessons.map(l => l.title).slice(0, 2).join(', ')}`
      alerts.push({
        id: `pending_lessons_${child.id}`,
        childId: child.id,
        childName: child.name,
        href: '/lessons',
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
  }

  // Household-wide: flag missing attendance for today (only when not filtering by child)
  if (!childId) {
    const todayAttendance = getAttendanceRecords({ date: today })
    const childIdsWithAttendance = new Set(todayAttendance.map(r => r.childId))
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
    const todayAttendance = getAttendanceRecords({ childId, date: today })
    if (todayAttendance.length === 0) {
      const child = activeChildren.find(c => c.id === childId)
      if (child) {
        alerts.push({
          id: `attendance_missing_${today}`,
          childId,
          childName: child.name,
          href: '/attendance',
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

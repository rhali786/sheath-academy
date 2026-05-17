import type { Alert } from '@/features/lib/types'
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

  for (const child of targetChildren) {
    const pendingLessons = getLessons(child.id).filter(
      l => l.dueDate <= today && l.status !== 'completed'
    )
    if (pendingLessons.length > 0) {
      const overdue = pendingLessons.filter(l => l.dueDate < today)
      alerts.push({
        id: `pending_lessons_${child.id}`,
        childId: child.id,
        title: `${pendingLessons.length} lesson${pendingLessons.length !== 1 ? 's' : ''} not completed`,
        detail: overdue.length > 0
          ? `${overdue.length} overdue: ${overdue.map(l => l.title).slice(0, 2).join(', ')}`
          : `Due today: ${pendingLessons.map(l => l.title).slice(0, 2).join(', ')}`,
        priority: overdue.length > 0 ? 'amber' : 'gray',
        actionButton: 'Review',
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
        title: 'Attendance not logged today',
        detail: `Missing for: ${missingAttendance.map(c => c.name).join(', ')}`,
        priority: 'amber',
        actionButton: 'Log',
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
          title: 'Attendance not logged today',
          detail: `Missing for: ${child.name}`,
          priority: 'amber',
          actionButton: 'Log',
        })
      }
    }
  }

  return alerts
}

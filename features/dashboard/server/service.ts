import type { Task, Alert, QuranSession, DashboardRecord, Child, SubjectProgress, QuranSessionRequest } from '@/features/lib/types'
import {
  tasksStore,
  quranSessionsStore,
  recordsStore,
  childrenStore,
  getProgressDataStore,
  resetProgressDataStore,
} from './store'
import {
  SEED_TASKS,
  SEED_QURAN_SESSIONS,
  SEED_RECORDS,
  SEED_CHILDREN,
} from './seed'
import { getLessons } from '@/features/planner/server/service'
import { getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { getStudentProfiles } from '@/features/children/server/service'

function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function getTasks(): Task[] {
  return tasksStore.getAll()
}

export function updateTask(taskId: string, completed: boolean): void {
  tasksStore.update(taskId, { completed })
}

export function getChildren(): Child[] {
  return childrenStore.getAll()
}

export function getAlerts(): Alert[] {
  const today = todayLocal()
  const activeChildren = getStudentProfiles().filter(p => p.isActive)
  const alerts: Alert[] = []

  for (const child of activeChildren) {
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

  // Household-wide: flag any active children with no attendance record for today
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

  return alerts
}

export function getQuranSessions(): QuranSession[] {
  return quranSessionsStore.getAll()
}

export function addQuranSession(sessionData: QuranSessionRequest): QuranSession {
  const sessions = quranSessionsStore.getAll()
  const newId = `quran_${String(sessions.length + 1).padStart(3, '0')}`

  const newSession: QuranSession = {
    id: newId,
    childId: sessionData.childId,
    type: sessionData.type,
    surah: sessionData.surah,
    fromAyah: sessionData.fromAyah,
    toAyah: sessionData.toAyah,
    notes: sessionData.notes || '',
    date: new Date().toISOString().split('T')[0],
    lastLogged: 'Today',
  }

  return quranSessionsStore.insert(newSession)
}

export function getRecords(): DashboardRecord[] {
  return recordsStore.getAll()
}

export function getProgressData(): { [childId: string]: SubjectProgress[] } {
  return getProgressDataStore()
}

export function resetStore(): void {
  tasksStore.reset(SEED_TASKS)
  quranSessionsStore.reset(SEED_QURAN_SESSIONS)
  recordsStore.reset(SEED_RECORDS)
  childrenStore.reset(SEED_CHILDREN)
  resetProgressDataStore()
}

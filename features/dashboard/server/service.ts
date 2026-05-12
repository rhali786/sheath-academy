import type { Task, Alert, QuranSession, DashboardRecord, Child, SubjectProgress, QuranSessionRequest } from '@/features/lib/types'
import {
  tasksStore,
  alertsStore,
  quranSessionsStore,
  recordsStore,
  childrenStore,
  getProgressDataStore,
  resetProgressDataStore,
} from './store'
import {
  SEED_TASKS,
  SEED_ALERTS,
  SEED_QURAN_SESSIONS,
  SEED_RECORDS,
  SEED_CHILDREN,
} from './seed'

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
  return alertsStore.getAll()
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
  alertsStore.reset(SEED_ALERTS)
  quranSessionsStore.reset(SEED_QURAN_SESSIONS)
  recordsStore.reset(SEED_RECORDS)
  childrenStore.reset(SEED_CHILDREN)
  resetProgressDataStore()
}

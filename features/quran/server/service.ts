import type { QuranSession, QuranSessionRequest } from '@/features/lib/types'
import { quranSessionsStore } from './store'
import { SEED_QURAN_SESSIONS } from './seed'

export function getQuranSessions(childId?: string): QuranSession[] {
  const all = quranSessionsStore.getAll()
  return childId ? all.filter(s => s.childId === childId) : all
}

export interface QuranSummary {
  childId?: string
  sessionsLogged: number
  sessionsByType: Array<{ type: string; count: number }>
  recentSessions: QuranSession[]
  dateRange: { startDate?: string; endDate?: string }
  streakDays: number
}

function calcStreak(sessions: QuranSession[]): number {
  const sessionDates = new Set(sessions.map(s => s.date))
  const today = new Date()
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  let streak = 0
  const cursor = new Date(today)
  while (sessionDates.has(fmt(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function getQuranSummary({
  childId,
  startDate,
  endDate,
}: {
  childId?: string
  startDate?: string
  endDate?: string
} = {}): QuranSummary {
  let sessions = getQuranSessions(childId)
  if (startDate) sessions = sessions.filter(s => s.date >= startDate)
  if (endDate) sessions = sessions.filter(s => s.date <= endDate)

  const byType: Record<string, number> = {}
  for (const s of sessions) {
    byType[s.type] = (byType[s.type] || 0) + 1
  }

  return {
    childId,
    sessionsLogged: sessions.length,
    sessionsByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    recentSessions: sessions.slice(0, 5),
    dateRange: { startDate, endDate },
    streakDays: calcStreak(getQuranSessions(childId)),
  }
}

export function addQuranSession(sessionData: QuranSessionRequest): QuranSession {
  const all = quranSessionsStore.getAll()
  const newId = `quran_${String(all.length + 1).padStart(3, '0')}_${Date.now()}`

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

export function updateQuranSession(
  id: string,
  patch: Partial<Pick<QuranSession, 'type' | 'surah' | 'fromAyah' | 'toAyah' | 'notes' | 'date'>>
): QuranSession | null {
  return quranSessionsStore.update(id, patch)
}

export function resetStore(): void {
  quranSessionsStore.reset(SEED_QURAN_SESSIONS)
}

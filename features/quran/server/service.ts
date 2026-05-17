import type { QuranSession, QuranSessionRequest } from '@/features/lib/types'
import { quranSessionsStore } from './store'
import { SEED_QURAN_SESSIONS } from './seed'

export function getQuranSessions(childId?: string): QuranSession[] {
  const all = quranSessionsStore.getAll()
  return childId ? all.filter(s => s.childId === childId) : all
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

export function resetStore(): void {
  quranSessionsStore.reset(SEED_QURAN_SESSIONS)
}

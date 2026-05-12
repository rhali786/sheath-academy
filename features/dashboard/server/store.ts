import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { Task, Alert, QuranSession, DashboardRecord, Child, SubjectProgress } from '@/features/lib/types'
import {
  SEED_TASKS,
  SEED_ALERTS,
  SEED_QURAN_SESSIONS,
  SEED_RECORDS,
  SEED_CHILDREN,
  SEED_PROGRESS_DATA,
} from './seed'

export const tasksStore = createMemoryStore<Task>(SEED_TASKS)
export const alertsStore = createMemoryStore<Alert>(SEED_ALERTS)
export const quranSessionsStore = createMemoryStore<QuranSession>(SEED_QURAN_SESSIONS)
export const recordsStore = createMemoryStore<DashboardRecord>(SEED_RECORDS)
export const childrenStore = createMemoryStore<Child>(SEED_CHILDREN)

// progressData is keyed by childId, not a flat T[], so managed separately
let progressDataStore: { [childId: string]: SubjectProgress[] } = JSON.parse(
  JSON.stringify(SEED_PROGRESS_DATA)
)

export function getProgressDataStore(): { [childId: string]: SubjectProgress[] } {
  return progressDataStore
}

export function resetProgressDataStore(): void {
  progressDataStore = JSON.parse(JSON.stringify(SEED_PROGRESS_DATA))
}

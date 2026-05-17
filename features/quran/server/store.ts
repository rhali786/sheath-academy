import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { QuranSession } from '@/features/lib/types'
import { SEED_QURAN_SESSIONS } from './seed'

export const quranSessionsStore = createMemoryStore<QuranSession>(SEED_QURAN_SESSIONS)

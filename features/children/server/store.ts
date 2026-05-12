import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { StudentProfile } from '@/features/lib/types'
import { SEED_STUDENT_PROFILES } from './seed'

export const studentProfilesStore = createMemoryStore<StudentProfile>(SEED_STUDENT_PROFILES)

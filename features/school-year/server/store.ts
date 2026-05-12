import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { SchoolYear } from '@/features/school-year/types'
import { SEED_SCHOOL_YEARS } from './seed'

export const schoolYearsStore = createMemoryStore<SchoolYear>(SEED_SCHOOL_YEARS)

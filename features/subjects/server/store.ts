import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { SubjectCourse } from '@/features/subjects/types'
import { SEED_SUBJECTS } from './seed'

export const subjectsStore = createMemoryStore<SubjectCourse>(SEED_SUBJECTS)

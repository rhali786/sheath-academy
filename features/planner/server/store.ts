import { createMemoryStore } from '@/features/lib/server/memoryStore'
import { LessonTask } from '../types'
import { SEED_LESSONS } from './seed'

export const lessonsStore = createMemoryStore<LessonTask>(SEED_LESSONS)

import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { LessonTask } from '@/features/lesson-tasks/types'
import { SEED_LESSON_TASKS } from './seed'

export const lessonTasksStore = createMemoryStore<LessonTask>(SEED_LESSON_TASKS)

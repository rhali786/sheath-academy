import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { Task, DashboardRecord, Child } from '@/features/lib/types'
import {
  SEED_TASKS,
  SEED_RECORDS,
  SEED_CHILDREN,
} from './seed'

export const tasksStore = createMemoryStore<Task>(SEED_TASKS)
export const recordsStore = createMemoryStore<DashboardRecord>(SEED_RECORDS)
export const childrenStore = createMemoryStore<Child>(SEED_CHILDREN)

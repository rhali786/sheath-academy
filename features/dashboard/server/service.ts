import type { Task, DashboardRecord, Child } from '@/features/lib/types'
import {
  tasksStore,
  recordsStore,
  childrenStore,
} from './store'
import {
  SEED_TASKS,
  SEED_RECORDS,
  SEED_CHILDREN,
} from './seed'

export function getTasks(): Task[] {
  return tasksStore.getAll()
}

export function updateTask(taskId: string, completed: boolean): void {
  tasksStore.update(taskId, { completed })
}

export function getChildren(): Child[] {
  return childrenStore.getAll()
}

export function getRecords(): DashboardRecord[] {
  return recordsStore.getAll()
}

export function resetStore(): void {
  tasksStore.reset(SEED_TASKS)
  recordsStore.reset(SEED_RECORDS)
  childrenStore.reset(SEED_CHILDREN)
}

// Memory store removed. Stubs kept for compilation.
// tasks/records routes are pending Postgres migration.
import type { Task, DashboardRecord, Child } from '@/features/lib/types'

export function getTasks(): Task[] { return [] }
export function updateTask(_taskId: string, _completed: boolean): void {}
export function getChildren(): Child[] { return [] }
export function getRecords(): DashboardRecord[] { return [] }
export function resetStore(): void {}

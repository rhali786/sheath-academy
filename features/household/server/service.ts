// Memory store removed. Stubs kept for compilation.
// Callers (workspace route, school-year, setup) are pending Postgres migration.
// Use household/server/repository for new code.
import type { Workspace, HouseholdProfile } from '@/features/lib/types'

export function getWorkspace(): Workspace | null { return null }
export function getHouseholdProfile(): HouseholdProfile | null { return null }
export function createWorkspace(_name: string, _ownerId?: string): Workspace { throw new Error('Use household/server/repository') }
export function createHouseholdProfile(_workspaceId: string, _familyName: string): HouseholdProfile { throw new Error('Use household/server/repository') }
export function updateHouseholdProfile(_patch: Partial<Omit<HouseholdProfile, 'id' | 'workspaceId' | 'createdAt'>>): HouseholdProfile | null { return null }
export function resetStore(): void {}
export function seedWorkspace(_workspace: Workspace): void {}
export function seedHouseholdProfile(_profile: HouseholdProfile): void {}

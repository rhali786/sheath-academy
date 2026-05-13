import type { Workspace, HouseholdProfile } from '@/features/lib/types'
import { workspacesStore, householdProfilesStore } from './store'
import { SEED_WORKSPACES, SEED_HOUSEHOLD_PROFILES } from './seed'
import { generateWorkspaceId, generateHouseholdId } from './ids'

export function getWorkspace(): Workspace | null {
  return workspacesStore.getAll()[0] ?? null
}

export function getHouseholdProfile(): HouseholdProfile | null {
  return householdProfilesStore.getAll()[0] ?? null
}

export function createWorkspace(name: string, ownerId: string = 'user_current'): Workspace {
  const workspace: Workspace = {
    id: generateWorkspaceId(),
    name,
    ownerId,
    createdAt: new Date().toISOString(),
  }
  workspacesStore.reset([workspace])
  return workspace
}

export function createHouseholdProfile(workspaceId: string, familyName: string): HouseholdProfile {
  const profile: HouseholdProfile = {
    id: generateHouseholdId(),
    workspaceId,
    familyName,
    createdAt: new Date().toISOString(),
  }
  householdProfilesStore.reset([profile])
  return profile
}

export function updateHouseholdProfile(
  familyName?: string,
  weekStartDay?: 'Monday' | 'Sunday'
): HouseholdProfile | null {
  const profile = householdProfilesStore.getAll()[0]
  if (!profile) return null
  const updates: Partial<HouseholdProfile> = {}
  if (familyName !== undefined) updates.familyName = familyName
  if (weekStartDay !== undefined) updates.weekStartDay = weekStartDay
  return householdProfilesStore.update(profile.id, updates)
}

/** Clears workspace + household profile (tests); dev uses initial module seed until reset. */
export function resetStore(): void {
  workspacesStore.reset([])
  householdProfilesStore.reset([])
}

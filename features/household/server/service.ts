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

export function updateHouseholdProfile(familyName: string): HouseholdProfile | null {
  const profile = householdProfilesStore.getAll()[0]
  if (!profile) return null
  return householdProfilesStore.update(profile.id, { familyName })
}

export function resetStore(): void {
  workspacesStore.reset(SEED_WORKSPACES)
  householdProfilesStore.reset(SEED_HOUSEHOLD_PROFILES)
}

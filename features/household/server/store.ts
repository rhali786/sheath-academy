import { createMemoryStore } from '@/features/lib/server/memoryStore'
import type { Workspace, HouseholdProfile } from '@/features/lib/types'
import { SEED_WORKSPACES, SEED_HOUSEHOLD_PROFILES } from './seed'

export const workspacesStore = createMemoryStore<Workspace>(SEED_WORKSPACES)
export const householdProfilesStore = createMemoryStore<HouseholdProfile>(SEED_HOUSEHOLD_PROFILES)

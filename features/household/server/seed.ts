import type { Workspace, HouseholdProfile } from '@/features/lib/types'
import { SEED_IDS } from '@/features/lib/seedIds'

/** Match `SEED_STUDENT_PROFILES` (`householdId` === profile id) so children APIs resolve. */
export const SEED_WORKSPACES: Workspace[] = [
  {
    id: SEED_IDS.workspace,
    name: 'Ahmed Family',
    ownerId: 'user_current',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

export const SEED_HOUSEHOLD_PROFILES: HouseholdProfile[] = [
  {
    id: SEED_IDS.household,
    workspaceId: SEED_IDS.workspace,
    familyName: 'Ahmed Family',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

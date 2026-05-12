import { getSetupStatus } from '@/features/setup/server/service'
import { resetStore as resetHousehold } from '@/features/household/server/service'
import { resetStore as resetChildren } from '@/features/children/server/service'
import { resetStore as resetSubjects } from '@/features/subjects/server/service'
import { resetStore as resetDashboard } from '@/features/dashboard/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'
import { workspacesStore, householdProfilesStore } from '@/features/household/server/store'
import { studentProfilesStore } from '@/features/children/server/store'

beforeEach(() => {
  resetHousehold()
  resetChildren()
  resetSubjects()
  resetDashboard()
})

describe('getSetupStatus', () => {
  it('returns nextStep "firstChild" when household exists but no children', () => {
    workspacesStore.reset([
      {
        id: SEED_IDS.workspace,
        name: 'W',
        ownerId: 'u',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    householdProfilesStore.reset([
      {
        id: SEED_IDS.household,
        workspaceId: SEED_IDS.workspace,
        familyName: 'F',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    studentProfilesStore.reset([])

    const body = getSetupStatus()
    expect(body.nextStep).toBe('firstChild')
    expect(body.completed).toEqual(['household'])
  })

  it('returns nextStep "firstSubject" when child exists but no subjects', () => {
    workspacesStore.reset([
      {
        id: SEED_IDS.workspace,
        name: 'W',
        ownerId: 'u',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    householdProfilesStore.reset([
      {
        id: SEED_IDS.household,
        workspaceId: SEED_IDS.workspace,
        familyName: 'F',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ])
    resetChildren()
    resetSubjects([])

    const body = getSetupStatus()
    expect(body.nextStep).toBe('firstSubject')
    expect(body.completed).toEqual(['household', 'firstChild'])
  })

  it('returns success-shaped object with nextStep and completed', () => {
    const body = getSetupStatus()
    expect(body).toHaveProperty('nextStep')
    expect(body).toHaveProperty('completed')
    expect(Array.isArray(body.completed)).toBe(true)
  })
})

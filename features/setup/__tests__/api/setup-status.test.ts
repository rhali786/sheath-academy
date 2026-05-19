import { getSetupStatus } from '@/features/setup/server/service'
import { resetStore as resetHousehold, seedWorkspace, seedHouseholdProfile } from '@/features/household/server/service'
import { resetStore as resetChildren, seedStudentProfiles } from '@/features/children/server/service'
import { resetStore as resetSubjects } from '@/features/subjects/server/service'
import { resetStore as resetDashboard } from '@/features/dashboard/server/service'
import { resetStore as resetPlan } from '@/features/plan/server/service'
import { resetStore as resetAttendance } from '@/features/attendance/server/service'
import { resetEvidenceStore } from '@/features/portfolio/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

function seedFullHouseholdWithSubjects() {
  seedWorkspace({
    id: SEED_IDS.workspace,
    name: 'W',
    ownerId: 'u',
    createdAt: '2026-01-01T00:00:00.000Z',
  })
  seedHouseholdProfile({
    id: SEED_IDS.household,
    workspaceId: SEED_IDS.workspace,
    familyName: 'F',
    createdAt: '2026-01-01T00:00:00.000Z',
  })
}

beforeEach(() => {
  resetHousehold()
  resetChildren()
  resetSubjects()
  resetDashboard()
  resetPlan()
  resetAttendance()
  resetEvidenceStore()
})

describe('getSetupStatus', () => {
  it('returns nextStep "firstChild" when household exists but no children', () => {
    seedWorkspace({
      id: SEED_IDS.workspace,
      name: 'W',
      ownerId: 'u',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    seedHouseholdProfile({
      id: SEED_IDS.household,
      workspaceId: SEED_IDS.workspace,
      familyName: 'F',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    seedStudentProfiles([])

    const body = getSetupStatus()
    expect(body.nextStep).toBe('firstChild')
    expect(body.completed).toEqual(['household'])
  })

  it('returns nextStep "firstSubject" when child exists but no subjects', () => {
    seedWorkspace({
      id: SEED_IDS.workspace,
      name: 'W',
      ownerId: 'u',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
    seedHouseholdProfile({
      id: SEED_IDS.household,
      workspaceId: SEED_IDS.workspace,
      familyName: 'F',
      createdAt: '2026-01-01T00:00:00.000Z',
    })
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

  it('returns nextStep "firstLesson" when household+children+subjects exist but no lessons', () => {
    seedFullHouseholdWithSubjects()
    resetPlan([])

    const body = getSetupStatus()
    expect(body.nextStep).toBe('firstLesson')
    expect(body.completed).toContain('firstSubject')
  })

  it('returns nextStep "firstAttendance" when lessons exist but no attendance', () => {
    seedFullHouseholdWithSubjects()
    // plan store has seed lessons (resetStore() was called in beforeEach)
    resetAttendance([])

    const body = getSetupStatus()
    expect(body.nextStep).toBe('firstAttendance')
    expect(body.completed).toContain('firstLesson')
  })

  it('returns nextStep "firstPortfolio" when attendance exists but no portfolio', () => {
    seedFullHouseholdWithSubjects()
    // plan + attendance have seed data
    resetEvidenceStore([])

    const body = getSetupStatus()
    expect(body.nextStep).toBe('firstPortfolio')
    expect(body.completed).toContain('firstAttendance')
  })

  it('returns nextStep null when all setup steps are complete', () => {
    seedFullHouseholdWithSubjects()
    // all stores have seed data (plan, attendance, portfolio)

    const body = getSetupStatus()
    expect(body.nextStep).toBeNull()
    expect(body.completed).toContain('firstPortfolio')
  })
})

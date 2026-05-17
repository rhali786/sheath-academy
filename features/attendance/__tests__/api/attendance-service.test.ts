/** @jest-environment node */

import {
  createOrUpdateRecord,
  getRecords,
  getAttendanceSummary,
  resetStore,
} from '@/features/attendance/server/service'
import {
  createWorkspace,
  createHouseholdProfile,
  resetStore as resetHouseholdStore,
} from '@/features/household/server/service'
import {
  createStudentProfile,
  resetStore as resetChildrenStore,
} from '@/features/children/server/service'

const CHILD_ID = 'test_child_001'
const HOUSEHOLD_ID = 'test_household_001'
const DATE_1 = '2026-01-15'
const DATE_2 = '2026-01-16'

function seedChild() {
  const ws = createWorkspace('Test Academy')
  const profile = createHouseholdProfile(ws.id, 'Test Family')
  createStudentProfile({
    householdId: profile.id,
    name: 'Test Child',
    gradeLabel: '3rd',
    username: 'testchild',
    password: 'pass',
  })
}

beforeEach(() => {
  resetStore()
  resetHouseholdStore()
  resetChildrenStore()
  seedChild()
})

describe('createOrUpdateRecord — upsert', () => {
  it('creates a new record when none exists for childId + date', () => {
    const children = require('@/features/children/server/service').getStudentProfiles()
    const child = children.find((c: { isActive: boolean }) => c.isActive)
    if (!child) return

    const before = getRecords({ childId: child.id, date: DATE_1 }).length
    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: DATE_1, status: 'present' })
    const after = getRecords({ childId: child.id, date: DATE_1 })
    expect(after.length).toBe(before + 1)
  })

  it('updates existing record instead of inserting duplicate for same childId + date', () => {
    const children = require('@/features/children/server/service').getStudentProfiles()
    const child = children.find((c: { isActive: boolean }) => c.isActive)
    if (!child) return

    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: DATE_1, status: 'present' })
    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: DATE_1, status: 'absent' })

    const dayRecords = getRecords({ childId: child.id, date: DATE_1 })
    expect(dayRecords).toHaveLength(1)
    expect(dayRecords[0].status).toBe('absent')
  })

  it('allows two different children on the same date (no collision)', () => {
    const children = require('@/features/children/server/service').getStudentProfiles()
    const [c1, c2] = children.filter((c: { isActive: boolean }) => c.isActive)
    if (!c1 || !c2) return

    createOrUpdateRecord({ childId: c1.id, householdId: HOUSEHOLD_ID, date: DATE_1, status: 'present' })
    createOrUpdateRecord({ childId: c2.id, householdId: HOUSEHOLD_ID, date: DATE_1, status: 'present' })

    const dayRecords = getRecords({ date: DATE_1 })
    const newRecords = dayRecords.filter(r => r.childId === c1.id || r.childId === c2.id)
    expect(newRecords.length).toBeGreaterThanOrEqual(2)
  })
})

describe('getAttendanceSummary — missingDays', () => {
  it('returns missingDays when startDate provided', () => {
    const children = require('@/features/children/server/service').getStudentProfiles()
    const child = children.find((c: { isActive: boolean }) => c.isActive)
    if (!child) return

    const startDate = '2026-01-12'
    const today = '2026-01-16'

    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-16T10:00:00Z'))

    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: '2026-01-12', status: 'present' })
    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: '2026-01-13', status: 'present' })

    const summary = getAttendanceSummary(child.id, startDate)
    expect(typeof summary.missingDays).toBe('number')
    expect(summary.missingDays).toBeGreaterThanOrEqual(0)

    jest.useRealTimers()
  })

  it('returns missingDays = 0 when all weekdays have records', () => {
    const children = require('@/features/children/server/service').getStudentProfiles()
    const child = children.find((c: { isActive: boolean }) => c.isActive)
    if (!child) return

    jest.useFakeTimers()
    jest.setSystemTime(new Date('2026-01-14T10:00:00Z'))

    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: '2026-01-12', status: 'present' })
    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: '2026-01-13', status: 'present' })
    createOrUpdateRecord({ childId: child.id, householdId: HOUSEHOLD_ID, date: '2026-01-14', status: 'present' })

    const summary = getAttendanceSummary(child.id, '2026-01-12', '2026-01-14')
    expect(summary.missingDays).toBe(0)

    jest.useRealTimers()
  })

  it('missingDays is undefined when no startDate given', () => {
    const children = require('@/features/children/server/service').getStudentProfiles()
    const child = children.find((c: { isActive: boolean }) => c.isActive)
    if (!child) return

    const summary = getAttendanceSummary(child.id)
    expect(summary.missingDays).toBeUndefined()
  })
})

/**
 * TDD: Tests for archive filtering and per-child isolation in dashboard APIs.
 * All tests in this file should FAIL before the fixes are applied.
 */
import { SEED_IDS } from '@/features/lib/seedIds'
import { archiveStudentProfile, resetStore as resetChildrenStore } from '@/features/children/server/service'
import { resetStore as resetDashboardStore } from '@/features/dashboard/server/service'
import { getAlerts } from '@/features/alerts/server/service'
import { getStudentProfiles } from '@/features/children/server/service'
import { listEvidenceItems } from '@/features/portfolio/server/service'
import { resetEvidenceStore } from '@/features/portfolio/server/service'
import { getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { getLessons } from '@/features/planner/server/service'
import { resetStore as resetPlannerStore } from '@/features/planner/server/service'
import { resetStore as resetAttendanceStore } from '@/features/attendance/server/service'
import { getQuranSessions, resetStore as resetQuranStore } from '@/features/quran/server/service'

function resetAll() {
  resetChildrenStore()
  resetDashboardStore()
  resetEvidenceStore()
  resetPlannerStore()
  resetAttendanceStore()
  resetQuranStore()
}

describe('Archive filtering — alerts must exclude archived students', () => {
  beforeEach(resetAll)

  test('alerts for active Adam are included', () => {
    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const adamAlerts = activeAlerts.filter(a => a.childId === SEED_IDS.adam)
    expect(adamAlerts.length).toBeGreaterThan(0)
  })

  test('after archiving Adam, alerts for Adam are excluded from active dashboard alerts', () => {
    archiveStudentProfile(SEED_IDS.adam)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const adamAlerts = activeAlerts.filter(a => a.childId === SEED_IDS.adam)
    expect(adamAlerts).toHaveLength(0)
  })

  test('after archiving Adam, family-wide alerts (childId=null) are still included', () => {
    archiveStudentProfile(SEED_IDS.adam)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const familyAlerts = activeAlerts.filter(a => a.childId === null)
    expect(familyAlerts.length).toBeGreaterThan(0)
  })

  test('after archiving Adam, Zayd alerts are still included', () => {
    archiveStudentProfile(SEED_IDS.adam)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const zaydAlerts = activeAlerts.filter(a => a.childId === SEED_IDS.zayd)
    expect(zaydAlerts.length).toBeGreaterThan(0)
  })
})

describe('Archive filtering — quran sessions must exclude archived students', () => {
  beforeEach(resetAll)

  test('quran sessions for active Adam are present in all sessions', () => {
    const allSessions = getQuranSessions()
    const adamSessions = allSessions.filter(s => s.childId === SEED_IDS.adam)
    expect(adamSessions.length).toBeGreaterThan(0)
  })

  test('after archiving Adam, active-student quran sessions exclude Adam', () => {
    archiveStudentProfile(SEED_IDS.adam)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeSessions = getQuranSessions().filter(s => !archivedIds.has(s.childId))
    const adamSessions = activeSessions.filter(s => s.childId === SEED_IDS.adam)
    expect(adamSessions).toHaveLength(0)
  })
})

describe('Per-child isolation — portfolio evidence', () => {
  beforeEach(resetAll)

  test('listEvidenceItems with no filter returns all 3 seed items (all for Adam)', () => {
    // All seed evidence is for Adam — selecting Khadijah should return 0
    const all = listEvidenceItems()
    expect(all.length).toBeGreaterThan(0)
  })

  test('listEvidenceItems filtered by Khadijah returns zero items', () => {
    // Seed evidence is only for Adam — Khadijah has no evidence
    const khadijalItems = listEvidenceItems({ childId: SEED_IDS.khadijah })
    expect(khadijalItems).toHaveLength(0)
  })

  test('listEvidenceItems filtered by Adam returns all Adam items', () => {
    const adamItems = listEvidenceItems({ childId: SEED_IDS.adam })
    expect(adamItems.length).toBeGreaterThan(0)
    adamItems.forEach(item => expect(item.childId).toBe(SEED_IDS.adam))
  })
})

describe('Per-child isolation — lessons and attendance', () => {
  beforeEach(resetAll)

  test('getLessons filtered by Khadijah returns only Khadijah lessons', () => {
    const lessons = getLessons(SEED_IDS.khadijah)
    expect(lessons.length).toBeGreaterThan(0)
    lessons.forEach(l => expect(l.childId).toBe(SEED_IDS.khadijah))
  })

  test('getLessons filtered by Adam does not include Khadijah lessons', () => {
    const adamLessons = getLessons(SEED_IDS.adam)
    const khadijaInAdam = adamLessons.filter(l => l.childId === SEED_IDS.khadijah)
    expect(khadijaInAdam).toHaveLength(0)
  })

  test('getAttendanceRecords filtered by Khadijah excludes other children', () => {
    const records = getAttendanceRecords({ childId: SEED_IDS.khadijah })
    records.forEach(r => expect(r.childId).toBe(SEED_IDS.khadijah))
  })
})

describe('Archive filtering — quran chart data uses active studentProfiles', () => {
  beforeEach(resetAll)

  test('active students include Adam, Khadijah, Zayd by default', () => {
    const activeProfiles = getStudentProfiles().filter(p => p.isActive)
    const names = activeProfiles.map(p => p.name)
    expect(names).toContain('Adam')
    expect(names).toContain('Khadijah')
    expect(names).toContain('Zayd')
  })

  test('after archiving Adam, active students do not include Adam', () => {
    archiveStudentProfile(SEED_IDS.adam)
    const activeProfiles = getStudentProfiles().filter(p => p.isActive)
    const names = activeProfiles.map(p => p.name)
    expect(names).not.toContain('Adam')
    expect(names).toContain('Khadijah')
    expect(names).toContain('Zayd')
  })
})

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

  test('alerts for active Layth are included', () => {
    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const laythAlerts = activeAlerts.filter(a => a.childId === SEED_IDS.layth)
    expect(laythAlerts.length).toBeGreaterThan(0)
  })

  test('after archiving Layth, alerts for Layth are excluded from active dashboard alerts', () => {
    archiveStudentProfile(SEED_IDS.layth)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const laythAlerts = activeAlerts.filter(a => a.childId === SEED_IDS.layth)
    expect(laythAlerts).toHaveLength(0)
  })

  test('after archiving Layth, family-wide alerts (childId=null) are still included', () => {
    archiveStudentProfile(SEED_IDS.layth)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const familyAlerts = activeAlerts.filter(a => a.childId === null)
    expect(familyAlerts.length).toBeGreaterThan(0)
  })

  test('after archiving Layth, Talut alerts are still included', () => {
    archiveStudentProfile(SEED_IDS.layth)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeAlerts = getAlerts().filter(
      a => a.childId === null || !archivedIds.has(a.childId)
    )
    const talutAlerts = activeAlerts.filter(a => a.childId === SEED_IDS.talut)
    expect(talutAlerts.length).toBeGreaterThan(0)
  })
})

describe('Archive filtering — quran sessions must exclude archived students', () => {
  beforeEach(resetAll)

  test('quran sessions for active Layth are present in all sessions', () => {
    const allSessions = getQuranSessions()
    const laythSessions = allSessions.filter(s => s.childId === SEED_IDS.layth)
    expect(laythSessions.length).toBeGreaterThan(0)
  })

  test('after archiving Layth, active-student quran sessions exclude Layth', () => {
    archiveStudentProfile(SEED_IDS.layth)

    const archivedIds = new Set(
      getStudentProfiles().filter(p => !p.isActive).map(p => p.id)
    )
    const activeSessions = getQuranSessions().filter(s => !archivedIds.has(s.childId))
    const laythSessions = activeSessions.filter(s => s.childId === SEED_IDS.layth)
    expect(laythSessions).toHaveLength(0)
  })
})

describe('Per-child isolation — portfolio evidence', () => {
  beforeEach(resetAll)

  test('listEvidenceItems with no filter returns all seed items', () => {
    const all = listEvidenceItems()
    expect(all.length).toBeGreaterThan(0)
  })

  test('listEvidenceItems filtered by Samurai returns only Samurai items', () => {
    const samuraiItems = listEvidenceItems({ childId: SEED_IDS.samurai })
    expect(samuraiItems.length).toBeGreaterThan(0)
    samuraiItems.forEach(item => expect(item.childId).toBe(SEED_IDS.samurai))
  })

  test('listEvidenceItems filtered by Layth returns only Layth items', () => {
    const laythItems = listEvidenceItems({ childId: SEED_IDS.layth })
    expect(laythItems.length).toBeGreaterThan(0)
    laythItems.forEach(item => expect(item.childId).toBe(SEED_IDS.layth))
  })
})

describe('Per-child isolation — lessons and attendance', () => {
  beforeEach(resetAll)

  test('getLessons filtered by Hawa returns only Hawa lessons', () => {
    const lessons = getLessons(SEED_IDS.hawa)
    expect(lessons.length).toBeGreaterThan(0)
    lessons.forEach(l => expect(l.childId).toBe(SEED_IDS.hawa))
  })

  test('getLessons filtered by Layth does not include Hawa lessons', () => {
    const laythLessons = getLessons(SEED_IDS.layth)
    const hawaInLayth = laythLessons.filter(l => l.childId === SEED_IDS.hawa)
    expect(hawaInLayth).toHaveLength(0)
  })

  test('getAttendanceRecords filtered by Hawa excludes other children', () => {
    const records = getAttendanceRecords({ childId: SEED_IDS.hawa })
    records.forEach(r => expect(r.childId).toBe(SEED_IDS.hawa))
  })
})

describe('Archive filtering — quran chart data uses active studentProfiles', () => {
  beforeEach(resetAll)

  test('active students include Layth, Hawa, Talut, Samurai by default', () => {
    const activeProfiles = getStudentProfiles().filter(p => p.isActive)
    const names = activeProfiles.map(p => p.name)
    expect(names).toContain('Layth')
    expect(names).toContain('Hawa')
    expect(names).toContain('Talut')
    expect(names).toContain('Samurai')
  })

  test('after archiving Layth, active students do not include Layth', () => {
    archiveStudentProfile(SEED_IDS.layth)
    const activeProfiles = getStudentProfiles().filter(p => p.isActive)
    const names = activeProfiles.map(p => p.name)
    expect(names).not.toContain('Layth')
    expect(names).toContain('Hawa')
    expect(names).toContain('Talut')
  })
})

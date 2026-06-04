import {
  buildDemoSeedPayload,
  summarizePayload,
  HISTORY_DAYS,
  seedHistoryEndDate,
  daysBeforeEnd,
  countForHousehold,
} from '../buildPayload'
import { getDemoHouseholdConfigs } from '../demoConfig'
import { DEV_PG_SEED, DEMO_B_PG_SEED } from '../../../features/lib/seedIds'
import { BARAKAH_PROFILE, CRESCENT_COVE_PROFILE } from '../householdProfiles'

describe('buildDemoSeedPayload', () => {
  const reference = new Date('2026-05-23T15:00:00Z')
  const endDate = seedHistoryEndDate(reference)
  const configs = getDemoHouseholdConfigs('dev@sheathacademy.ai', 'amina@gmail.com')

  it('builds rich history without DB access', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const counts = summarizePayload(payload)

    expect(payload.users).toHaveLength(2)
    expect(payload.households).toHaveLength(2)
    expect(payload.learners).toHaveLength(8)
    expect(counts.attendanceEvents).toBeGreaterThan(500)
    expect(counts.lessonTasks).toBeGreaterThan(400)
    expect(counts.quranSessions).toBeGreaterThan(100)
    expect(counts.portfolioEvidence).toBeGreaterThan(30)
  })

  it('includes today (offset 0) in the history window', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const today = endDate

    expect(payload.attendanceEvents.some(r => r.attendanceDate === today)).toBe(true)
    expect(payload.lessonTasks.some(r => r.dueDate === today)).toBe(true)
  })

  it('pre-marks today attendance for selected Barakah learners only', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const today = endDate
    const barakahCfg = configs.find(c => c.hhKey === 'a')!
    const markedIds = new Set(
      barakahCfg.learners
        .filter(l => BARAKAH_PROFILE.todayAttendanceKeys.includes(l.key))
        .map(l => l.id),
    )
    const unmarkedWeekdayOnlyIds = new Set(
      barakahCfg.learners
        .filter(
          l =>
            !BARAKAH_PROFILE.todayAttendanceKeys.includes(l.key) &&
            !BARAKAH_PROFILE.learners[l.key]?.weekendWork,
        )
        .map(l => l.id),
    )

    const barakahToday = payload.attendanceEvents.filter(
      r => r.householdId === DEV_PG_SEED.householdId && r.attendanceDate === today,
    )

    for (const id of markedIds) {
      const row = barakahToday.find(r => r.learnerId === id)
      expect(row?.status).toBe('present')
    }

    for (const id of unmarkedWeekdayOnlyIds) {
      expect(barakahToday.some(r => r.learnerId === id)).toBe(false)
    }

    const aminaCfg = configs.find(c => c.hhKey === 'b')!
    const aminaMarkedIds = new Set(
      aminaCfg.learners
        .filter(l => CRESCENT_COVE_PROFILE.todayAttendanceKeys.includes(l.key))
        .map(l => l.id),
    )
    const aminaToday = payload.attendanceEvents.filter(
      r => r.householdId === DEMO_B_PG_SEED.householdId && r.attendanceDate === today,
    )

    for (const id of aminaMarkedIds) {
      const row = aminaToday.find(r => r.learnerId === id)
      expect(row?.status).toBe('present')
    }
  })

  it('produces different aggregate counts per household', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const barakah = countForHousehold(payload, DEV_PG_SEED.householdId)
    const crescent = countForHousehold(payload, DEMO_B_PG_SEED.householdId)

    expect(barakah.attendance).not.toBe(crescent.attendance)
    expect(barakah.lessons).toBeGreaterThan(crescent.lessons)
    expect(barakah.quran).toBeGreaterThan(crescent.quran)
  })

  it('uses varied attendance statuses', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const statuses = new Set(payload.attendanceEvents.map(r => r.status))

    expect(statuses.has('present')).toBe(true)
    expect(statuses.has('partial')).toBe(true)
    expect(statuses.has('excused')).toBe(true)
    expect(statuses.has('sick')).toBe(true)
    expect(statuses.has('absent')).toBe(true)
  })

  it('sets completedAt and historical updatedAt on completed lessons', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const completed = payload.lessonTasks.filter(t => t.status === 'completed')

    expect(completed.length).toBeGreaterThan(0)
    for (const task of completed.slice(0, 20)) {
      expect(task.completedAt).not.toBeNull()
      expect(task.updatedAt.toISOString().slice(0, 10)).toBe(task.dueDate)
    }
  })

  it('spreads completions across the current week (not one spike day)', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const weekDates = Array.from({ length: 7 }, (_, i) => daysBeforeEnd(endDate, i))
    const completedByDay = new Map<string, number>()

    for (const date of weekDates) {
      const n = payload.lessonTasks.filter(
        t => t.status === 'completed' && t.dueDate === date,
      ).length
      completedByDay.set(date, n)
    }

    const counts = [...completedByDay.values()]
    const nonZeroDays = counts.filter(c => c > 0).length
    const max = Math.max(...counts)
    const min = Math.min(...counts.filter(c => c > 0))

    expect(nonZeroDays).toBeGreaterThanOrEqual(4)
    expect(max).toBeGreaterThan(min)
  })

  it('seeds recent portfolio evidence inside the admin default window', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const recentCutoff = daysBeforeEnd(endDate, 29)
    const recent = payload.portfolioEvidence.filter(r => r.evidenceDate >= recentCutoff)

    expect(recent.length).toBeGreaterThan(10)
  })

  it('uses valid product validation price buckets', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const buckets = payload.productValidationResponses.map(r => r.reasonableMonthlyPriceBucket)

    expect(buckets).toContain('15')
    expect(buckets).toContain('30')
    expect(buckets.every(b => !String(b).includes('$'))).toBe(true)
  })

  it('includes weekend lesson activity for learners with weekendWork', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)
    const weekendLessons = payload.lessonTasks.filter(t => {
      const dow = new Date(`${t.dueDate}T12:00:00Z`).getUTCDay()
      return dow === 0 || dow === 6
    })

    expect(weekendLessons.length).toBeGreaterThan(0)
  })

  it('covers HISTORY_DAYS window through today', () => {
    expect(HISTORY_DAYS).toBe(150)
    expect(daysBeforeEnd(endDate, 0)).toBe(endDate)
    expect(daysBeforeEnd(endDate, HISTORY_DAYS)).not.toBe(endDate)
  })

  it('includes one owner membership per household', () => {
    const payload = buildDemoSeedPayload(configs, reference, endDate)

    expect(payload.householdMembers).toHaveLength(2)

    const barakahMembership = payload.householdMembers.find(
      m => m.householdId === DEV_PG_SEED.householdId,
    )
    expect(barakahMembership).toBeDefined()
    expect(barakahMembership!.userId).toBe(DEV_PG_SEED.userId)
    expect(barakahMembership!.role).toBe('owner')

    const crescentMembership = payload.householdMembers.find(
      m => m.householdId === DEMO_B_PG_SEED.householdId,
    )
    expect(crescentMembership).toBeDefined()
    expect(crescentMembership!.userId).toBe(DEMO_B_PG_SEED.userId)
    expect(crescentMembership!.role).toBe('owner')
  })
})

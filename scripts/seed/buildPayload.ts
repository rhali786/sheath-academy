import {
  users,
  households,
  schoolYears,
  learners,
  subjects,
  lessonTasks,
  attendanceEvents,
  quranSessions,
  portfolioEvidence,
  householdSettings,
  userSettings,
  productValidationResponses,
} from '../../db/schema'
import type { HouseholdSeedConfig, LearnerConfig } from './demoConfig'

export const HISTORY_DAYS = 150

/** Fixed anchor so demo history is identical regardless of seed run date. */
export const SEED_HISTORY_END_DATE = '2026-05-22'

const TASK_TITLES: Record<string, string[]> = {
  Mathematics: ['Complete worksheet 1–5', 'Review multiplication tables', 'Practice fractions', 'Word problems set A', 'Mental math drills'],
  Quran: ['Memorise Al-Fatiha verse', 'Review Al-Baqarah 1–5', 'Tajweed practice', 'Recitation check', 'Surah revision'],
  Arabic: ['Vocabulary review', 'Grammar worksheet', 'Reading passage', 'Writing practice', 'Dictation exercise'],
  Science: ['Read chapter 3', 'Lab observation notes', 'Diagram labelling', 'Vocabulary quiz', 'Research summary'],
  Reading: ['Read pages 1–10', 'Comprehension questions', 'Vocabulary notebook', 'Book report draft', 'Reading log entry'],
  History: ['Timeline activity', 'Map exercise', 'Research notes', 'Summary writing', 'Document analysis'],
  Writing: ['Journal entry', 'Essay draft', 'Grammar practice', 'Sentence expansion', 'Editing checklist'],
  Art: ['Sketch project', 'Colour theory worksheet', 'Portfolio piece', 'Art history notes', 'Still-life drawing'],
}

const SURAHS = ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran', 'An-Nisa', 'Al-Maidah', 'Al-Anam']
const SESSION_TYPES = ['memorization', 'revision', 'recitation']

export type DemoSeedPayload = {
  users: (typeof users.$inferInsert)[]
  households: (typeof households.$inferInsert)[]
  schoolYears: (typeof schoolYears.$inferInsert)[]
  learners: (typeof learners.$inferInsert)[]
  subjects: (typeof subjects.$inferInsert)[]
  attendanceEvents: (typeof attendanceEvents.$inferInsert)[]
  lessonTasks: (typeof lessonTasks.$inferInsert)[]
  quranSessions: (typeof quranSessions.$inferInsert)[]
  portfolioEvidence: (typeof portfolioEvidence.$inferInsert)[]
  householdSettings: (typeof householdSettings.$inferInsert)[]
  userSettings: (typeof userSettings.$inferInsert)[]
  productValidationResponses: (typeof productValidationResponses.$inferInsert)[]
}

function daysBeforeAnchor(n: number): string {
  const d = new Date(`${SEED_HISTORY_END_DATE}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - n)
  return d.toISOString().split('T')[0]
}

function isWeekday(dateStr: string): boolean {
  const day = new Date(`${dateStr}T12:00:00Z`).getUTCDay()
  return day >= 1 && day <= 5
}

function buildHistoryRows(
  hhKey: string,
  householdId: string,
  learnersList: LearnerConfig[],
  seedNow: Date,
): Pick<
  DemoSeedPayload,
  'attendanceEvents' | 'lessonTasks' | 'quranSessions' | 'portfolioEvidence'
> {
  const attendanceEventsRows: (typeof attendanceEvents.$inferInsert)[] = []
  const lessonTasksRows: (typeof lessonTasks.$inferInsert)[] = []
  const quranSessionsRows: (typeof quranSessions.$inferInsert)[] = []
  const portfolioEvidenceRows: (typeof portfolioEvidence.$inferInsert)[] = []

  for (let offset = HISTORY_DAYS; offset >= 1; offset--) {
    const dateStr = daysBeforeAnchor(offset)
    const weekday = isWeekday(dateStr)

    for (const lc of learnersList) {
      const quranSub = lc.subjects.find(s => s.category === 'quran')

      if (weekday) {
        const attStatus =
          offset % 13 === 0 ? 'sick' :
          offset % 11 === 0 ? 'excused' :
          offset % 9 === 0 ? 'absent' :
          offset % 7 === 0 ? 'partial' :
          'present'
        const minutes =
          attStatus === 'present' ? 360 :
          attStatus === 'partial' ? 300 :
          attStatus === 'sick' ? 180 :
          null

        attendanceEventsRows.push({
          id: `att_${hhKey}_${lc.key}_${dateStr}`,
          householdId,
          learnerId: lc.id,
          attendanceDate: dateStr,
          status: attStatus,
          minutes,
          notes: null,
          occurredAt: seedNow,
          voidedAt: null,
          createdAt: seedNow,
          updatedAt: seedNow,
        })
      }

      if (offset % 2 === 0) {
        const subIdx = Math.floor(offset / 2) % lc.subjects.length
        const sub = lc.subjects[subIdx]
        const titles = TASK_TITLES[sub.name] ?? ['Complete assignment', 'Review material', 'Assessment prep']
        const titleIdx = Math.floor(offset / 2) % titles.length
        const taskStatus = offset > 14 ? 'completed' : 'not_started'
        const completedAt = taskStatus === 'completed' ? new Date(`${dateStr}T15:00:00Z`) : null
        const activityAt =
          taskStatus === 'completed'
            ? completedAt!
            : new Date(`${dateStr}T09:00:00Z`)

        lessonTasksRows.push({
          id: `lt_${hhKey}_${lc.key}_${sub.id.slice(-8)}_o${offset}`,
          householdId,
          learnerId: lc.id,
          subjectId: sub.id,
          title: titles[titleIdx],
          description: null,
          notes: null,
          dueDate: dateStr,
          status: taskStatus,
          sortOrder: 0,
          completedAt,
          skippedAt: null,
          createdAt: seedNow,
          updatedAt: activityAt,
        })
      }

      if (offset % 3 === 0 && quranSub) {
        const surahIdx = Math.floor(offset / 3) % SURAHS.length
        const typeIdx = Math.floor(offset / 3) % SESSION_TYPES.length

        quranSessionsRows.push({
          id: `qur_${hhKey}_${lc.key}_o${offset}`,
          householdId,
          learnerId: lc.id,
          sessionDate: dateStr,
          sessionType: SESSION_TYPES[typeIdx],
          surah: SURAHS[surahIdx],
          fromAyah: 1,
          toAyah: 5 + (offset % 5),
          durationMinutes: 20 + (offset % 3) * 10,
          notes: null,
          createdAt: seedNow,
          updatedAt: seedNow,
        })
      }

      if (offset % 30 === 0) {
        const monthIdx = offset / 30 - 1
        const monthLabels = ['march', 'february', 'january', 'december', 'november']
        const monthLabel = monthLabels[monthIdx] ?? `month_${monthIdx + 1}`
        const sub = lc.subjects[monthIdx % lc.subjects.length]
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

        portfolioEvidenceRows.push({
          id: `ev_${hhKey}_${lc.key}_${monthLabel}`,
          householdId,
          learnerId: lc.id,
          subjectId: sub.id,
          lessonTaskId: null,
          quranSessionId: null,
          attendanceEventId: null,
          title: `${sub.name} — ${cap(monthLabel)} portfolio`,
          description: `Monthly work sample for ${sub.name}`,
          evidenceType: 'work_sample',
          url: null,
          evidenceDate: dateStr,
          createdAt: seedNow,
          updatedAt: seedNow,
        })
      }
    }
  }

  return {
    attendanceEvents: attendanceEventsRows,
    lessonTasks: lessonTasksRows,
    quranSessions: quranSessionsRows,
    portfolioEvidence: portfolioEvidenceRows,
  }
}

function buildHouseholdRows(cfg: HouseholdSeedConfig, seedNow: Date): Omit<DemoSeedPayload, 'users'> {
  const householdId = cfg.householdId

  const schoolYearsRows: (typeof schoolYears.$inferInsert)[] = [{
    id: cfg.schoolYearId,
    householdId,
    name: '2025–2026',
    startDate: '2025-08-25',
    endDate: '2026-06-12',
    isActive: true,
    requiredDays: null,
    requiredHours: null,
    trackingMethod: null,
    schoolDays: null,
    breaks: null,
    termStructure: null,
    createdAt: seedNow,
    updatedAt: seedNow,
  }]

  const learnersRows: (typeof learners.$inferInsert)[] = cfg.learners.map(lc => ({
    id: lc.id,
    householdId,
    name: lc.name,
    displayColor: null,
    gradeLevel: lc.gradeLevel,
    isActive: true,
    archivedAt: null,
    sortOrder: lc.sortOrder,
    createdAt: seedNow,
    updatedAt: seedNow,
  }))

  const subjectsRows: (typeof subjects.$inferInsert)[] = cfg.learners.flatMap(lc =>
    lc.subjects.map((sub, idx) => ({
      id: sub.id,
      householdId,
      learnerId: lc.id,
      name: sub.name,
      category: sub.category,
      description: null,
      color: null,
      sortOrder: idx,
      isActive: true,
      createdAt: seedNow,
      updatedAt: seedNow,
    })),
  )

  const householdSettingsRows: (typeof householdSettings.$inferInsert)[] = [
    { id: `hs_${householdId}_onboarding`, householdId, key: 'onboarding_completed', value: true, createdAt: seedNow, updatedAt: seedNow },
    { id: `hs_${householdId}_curriculum`, householdId, key: 'curriculum_year', value: '2025-2026', createdAt: seedNow, updatedAt: seedNow },
    { id: `hs_${householdId}_session_min`, householdId, key: 'default_session_minutes', value: 360, createdAt: seedNow, updatedAt: seedNow },
  ]

  const userSettingsRows: (typeof userSettings.$inferInsert)[] = [
    { id: `us_${cfg.userId}_notifications`, userId: cfg.userId, key: 'notifications_enabled', value: true, createdAt: seedNow, updatedAt: seedNow },
    { id: `us_${cfg.userId}_theme`, userId: cfg.userId, key: 'theme', value: 'system', createdAt: seedNow, updatedAt: seedNow },
  ]

  const scores = cfg.isAdmin
    ? { prev: 8, improvement: 9, ease: 8, trust: 9, retention: 9, pay: 7, referral: 9, clarity: 8, fork: '8.75' }
    : { prev: 7, improvement: 8, ease: 9, trust: 8, retention: 9, pay: 8, referral: 8, clarity: 7, fork: '8.13' }

  const productValidationRows: (typeof productValidationResponses.$inferInsert)[] = [{
    id: cfg.productValId,
    userId: cfg.userId,
    householdId: null,
    tenantId: householdId,
    respondentName: cfg.userName,
    respondentEmail: cfg.email,
    respondentType: 'homeschool_parent',
    householdOrProgramType: 'single_family',
    usageDuration: '3_to_6_months',
    usedFeatureAreas: ['dashboard', 'planner', 'attendance', 'quran', 'portfolio'],
    previousPainScore: scores.prev,
    improvementScore: scores.improvement,
    easeScore: scores.ease,
    trustScore: scores.trust,
    retentionScore: scores.retention,
    payScore: scores.pay,
    referralScore: scores.referral,
    positioningClarityScore: scores.clarity,
    reasonableMonthlyPriceBucket: '$10–$20',
    pricingNotes: 'Fair for what it offers',
    replacedWhat: 'Spreadsheets and paper planners',
    mostUseful: 'Attendance tracking and daily planner',
    confusingOrBurdensome: 'Initial setup took some getting used to',
    mustHaveChange: 'Offline mode would be great',
    lostAccessReaction: 'I would be very frustrated — we rely on it daily',
    recommendTo: 'Any homeschool family with more than one child',
    referralMessage: 'Sheath Academy has simplified our homeschool record-keeping enormously',
    additionalNotes: null,
    mayContact: true,
    mayQuoteAnonymized: true,
    mayQuoteWithName: false,
    forkTestFitScore: scores.fork,
    createdAt: seedNow,
    updatedAt: seedNow,
  }]

  const history = buildHistoryRows(cfg.hhKey, householdId, cfg.learners, seedNow)

  return {
    households: [{
      id: householdId,
      userId: cfg.userId,
      name: cfg.householdName,
      timezone: 'America/New_York',
      setupCompletedAt: null,
      createdAt: seedNow,
      updatedAt: seedNow,
    }],
    schoolYears: schoolYearsRows,
    learners: learnersRows,
    subjects: subjectsRows,
    householdSettings: householdSettingsRows,
    userSettings: userSettingsRows,
    productValidationResponses: productValidationRows,
    ...history,
  }
}

/** Builds the full demo payload in memory — zero database calls. */
export function buildDemoSeedPayload(configs: HouseholdSeedConfig[], seedNow = new Date()): DemoSeedPayload {
  const usersRows: (typeof users.$inferInsert)[] = configs.map(cfg => ({
    id: cfg.userId,
    email: cfg.email,
    name: cfg.userName,
    role: cfg.isAdmin ? 'admin' : 'user',
    createdAt: seedNow,
    updatedAt: seedNow,
  }))

  const payload: DemoSeedPayload = {
    users: usersRows,
    households: [],
    schoolYears: [],
    learners: [],
    subjects: [],
    attendanceEvents: [],
    lessonTasks: [],
    quranSessions: [],
    portfolioEvidence: [],
    householdSettings: [],
    userSettings: [],
    productValidationResponses: [],
  }

  for (const cfg of configs) {
    const householdRows = buildHouseholdRows(cfg, seedNow)
    payload.households.push(...householdRows.households)
    payload.schoolYears.push(...householdRows.schoolYears)
    payload.learners.push(...householdRows.learners)
    payload.subjects.push(...householdRows.subjects)
    payload.householdSettings.push(...householdRows.householdSettings)
    payload.userSettings.push(...householdRows.userSettings)
    payload.productValidationResponses.push(...householdRows.productValidationResponses)
    payload.attendanceEvents.push(...householdRows.attendanceEvents)
    payload.lessonTasks.push(...householdRows.lessonTasks)
    payload.quranSessions.push(...householdRows.quranSessions)
    payload.portfolioEvidence.push(...householdRows.portfolioEvidence)
  }

  return payload
}

export function summarizePayload(payload: DemoSeedPayload): Record<string, number> {
  return {
    users: payload.users.length,
    households: payload.households.length,
    schoolYears: payload.schoolYears.length,
    learners: payload.learners.length,
    subjects: payload.subjects.length,
    attendanceEvents: payload.attendanceEvents.length,
    lessonTasks: payload.lessonTasks.length,
    quranSessions: payload.quranSessions.length,
    portfolioEvidence: payload.portfolioEvidence.length,
    householdSettings: payload.householdSettings.length,
    userSettings: payload.userSettings.length,
    productValidationResponses: payload.productValidationResponses.length,
  }
}

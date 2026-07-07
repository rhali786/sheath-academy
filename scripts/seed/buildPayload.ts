import {
  users,
  households,
  householdMembers,
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
  resources,
  scores,
  complianceDeadlines,
  badgeAwards,
} from '../../db/schema'
import type { HouseholdSeedConfig, LearnerConfig } from './demoConfig'
import { getHouseholdProfile, type HouseholdActivityProfile, type LearnerActivityProfile } from './householdProfiles'

export const HISTORY_DAYS = 150

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
  householdMembers: (typeof householdMembers.$inferInsert)[]
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
  resources: (typeof resources.$inferInsert)[]
  scores: (typeof scores.$inferInsert)[]
  complianceDeadlines: (typeof complianceDeadlines.$inferInsert)[]
  badgeAwards: (typeof badgeAwards.$inferInsert)[]
}

/** UTC calendar date for today — history ends here (offset 0). */
export function seedHistoryEndDate(reference = new Date()): string {
  const y = reference.getUTCFullYear()
  const m = String(reference.getUTCMonth() + 1).padStart(2, '0')
  const d = String(reference.getUTCDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function daysBeforeEnd(endDate: string, daysAgo: number): string {
  const d = new Date(`${endDate}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

function dayOfWeek(dateStr: string): number {
  return new Date(`${dateStr}T12:00:00Z`).getUTCDay()
}

function isWeekend(dateStr: string): boolean {
  const dow = dayOfWeek(dateStr)
  return dow === 0 || dow === 6
}

function isWeekday(dateStr: string): boolean {
  return !isWeekend(dateStr)
}

function stableHash(...parts: (string | number)[]): number {
  const s = parts.join(':')
  let h = 0
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

function pickAttendanceStatus(
  hhKey: string,
  learnerKey: string,
  offset: number,
  profile: LearnerActivityProfile,
): string | null {
  const roll = stableHash(hhKey, learnerKey, offset, profile.attendancePhase) % 100
  if (roll >= profile.attendanceRate * 100) return null

  const variant = stableHash('att', hhKey, learnerKey, offset) % 100
  if (variant < 4) return 'sick'
  if (variant < 8) return 'excused'
  if (variant < 14) return 'absent'
  if (variant < 22) return 'partial'
  return 'present'
}

function attendanceMinutes(status: string): number | null {
  if (status === 'present') return 360
  if (status === 'partial') return 300
  if (status === 'sick') return 180
  return null
}

function shouldSchoolDay(
  dateStr: string,
  offset: number,
  learner: LearnerActivityProfile,
  todayMarked: boolean,
): boolean {
  if (todayMarked && offset === 0) return true
  if (isWeekday(dateStr)) return true
  return learner.weekendWork && isWeekend(dateStr)
}

function shouldCreateLesson(
  offset: number,
  learner: LearnerActivityProfile,
  slot: number,
): boolean {
  const every = slot === 0 ? learner.lessonEveryDays : learner.extraLessonEveryDays
  if (every <= 0) return false
  const phase = learner.lessonPhase + slot * 2
  return (offset + phase) % every === 0
}

function lessonStatus(
  offset: number,
  learner: LearnerActivityProfile,
  hhKey: string,
  learnerKey: string,
  slot: number,
): 'completed' | 'not_started' {
  if (offset <= 2) {
    const backlog = stableHash('backlog', hhKey, learnerKey, offset, slot) % 100
    return backlog < 45 ? 'not_started' : 'completed'
  }
  if (offset <= 7) {
    const recent = stableHash('recent', hhKey, learnerKey, offset, slot) % 100
    if (recent < 25) return 'not_started'
  }
  const roll = stableHash('done', hhKey, learnerKey, offset, slot) % 100
  return roll < learner.completionRate * 100 ? 'completed' : 'not_started'
}

function buildHistoryRows(
  cfg: HouseholdSeedConfig,
  profile: HouseholdActivityProfile,
  endDate: string,
  seedNow: Date,
): Pick<
  DemoSeedPayload,
  'attendanceEvents' | 'lessonTasks' | 'quranSessions' | 'portfolioEvidence'
> {
  const { hhKey, householdId, learners: learnersList } = cfg
  const attendanceEventsRows: (typeof attendanceEvents.$inferInsert)[] = []
  const lessonTasksRows: (typeof lessonTasks.$inferInsert)[] = []
  const quranSessionsRows: (typeof quranSessions.$inferInsert)[] = []
  const portfolioEvidenceRows: (typeof portfolioEvidence.$inferInsert)[] = []

  const evidenceSet = new Set<string>()

  for (let offset = HISTORY_DAYS; offset >= 0; offset--) {
    const dateStr = daysBeforeEnd(endDate, offset)

    for (const lc of learnersList) {
      const learnerProfile = profile.learners[lc.key]
      if (!learnerProfile) continue

      const quranSub = lc.subjects.find(s => s.category === 'quran')
      const todayMarked = profile.todayAttendanceKeys.includes(lc.key)

      if (shouldSchoolDay(dateStr, offset, learnerProfile, todayMarked)) {
        let attStatus: string | null
        if (offset === 0 && todayMarked) {
          attStatus = 'present'
        } else {
          attStatus = pickAttendanceStatus(hhKey, lc.key, offset, learnerProfile)
        }

        if (attStatus) {
          attendanceEventsRows.push({
            id: `att_${hhKey}_${lc.key}_${dateStr}`,
            householdId,
            learnerId: lc.id,
            attendanceDate: dateStr,
            status: attStatus,
            minutes: attendanceMinutes(attStatus),
            notes: null,
            occurredAt: seedNow,
            voidedAt: null,
            createdAt: seedNow,
            updatedAt: seedNow,
          })
        }
      }

      for (let slot = 0; slot < 2; slot++) {
        if (!shouldCreateLesson(offset, learnerProfile, slot)) continue

        const subIdx = (offset + learnerProfile.lessonPhase + slot) % lc.subjects.length
        const sub = lc.subjects[subIdx]
        const titles = TASK_TITLES[sub.name] ?? ['Complete assignment', 'Review material', 'Assessment prep']
        const titleIdx = Math.floor((offset + slot) / 2) % titles.length
        const taskStatus = lessonStatus(offset, learnerProfile, hhKey, lc.key, slot)
        const completedAt = taskStatus === 'completed' ? new Date(`${dateStr}T15:00:00Z`) : null
        const activityAt =
          taskStatus === 'completed'
            ? completedAt!
            : new Date(`${dateStr}T09:00:00Z`)

        lessonTasksRows.push({
          id: `lt_${hhKey}_${lc.key}_${sub.id.slice(-8)}_o${offset}_s${slot}`,
          householdId,
          learnerId: lc.id,
          subjectId: sub.id,
          title: titles[titleIdx],
          description: null,
          notes: null,
          dueDate: dateStr,
          status: taskStatus,
          sortOrder: slot,
          completedAt,
          skippedAt: null,
          createdAt: seedNow,
          updatedAt: activityAt,
        })
      }

      if (
        quranSub &&
        learnerProfile.quranEveryDays > 0 &&
        (offset + learnerProfile.quranPhase) % learnerProfile.quranEveryDays === 0 &&
        shouldSchoolDay(dateStr, offset, learnerProfile, false)
      ) {
        const surahIdx = Math.floor(offset / learnerProfile.quranEveryDays) % SURAHS.length
        const typeIdx = Math.floor(offset / 2) % SESSION_TYPES.length

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
    }

    if (profile.evidenceOffsets.includes(offset)) {
      for (const lc of learnersList) {
        const key = `${lc.key}:${offset}`
        if (evidenceSet.has(key)) continue
        evidenceSet.add(key)

        const sub = lc.subjects[offset % lc.subjects.length]
        portfolioEvidenceRows.push({
          id: `ev_${hhKey}_${lc.key}_d${offset}`,
          householdId,
          learnerId: lc.id,
          subjectId: sub.id,
          lessonTaskId: null,
          quranSessionId: null,
          attendanceEventId: null,
          title: `${sub.name} — work sample`,
          description: `Portfolio sample for ${sub.name}`,
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

// Starter badge IDs — must match what seed-reference-data.ts inserts
const STARTER_BADGE_IDS = [
  'badge_starter_quran_memorizer',
  'badge_starter_math_champion',
  'badge_starter_avid_reader',
  'badge_starter_science_explorer',
  'badge_starter_history_detective',
  'badge_starter_creative_writer',
  'badge_starter_language_learner',
  'badge_starter_community_helper',
]

function buildNewTableRows(
  cfg: HouseholdSeedConfig,
  hhIdx: number,
  endDate: string,
  seedNow: Date,
): Pick<DemoSeedPayload, 'scores' | 'complianceDeadlines' | 'badgeAwards'> {
  const scoresRows: (typeof scores.$inferInsert)[] = []
  const complianceDeadlinesRows: (typeof complianceDeadlines.$inferInsert)[] = []
  const badgeAwardsRows: (typeof badgeAwards.$inferInsert)[] = []

  // ── Scores: 4-8 per learner per subject, spread over the 150-day history ──
  for (let learnerIdx = 0; learnerIdx < cfg.learners.length; learnerIdx++) {
    const lc = cfg.learners[learnerIdx]
    for (let subjectIdx = 0; subjectIdx < lc.subjects.length; subjectIdx++) {
      const sub = lc.subjects[subjectIdx]
      // Deterministic number of scores per learner+subject (4-8)
      const numScores = 4 + stableHash('nscores', hhIdx, learnerIdx, subjectIdx) % 5
      for (let n = 0; n < numScores; n++) {
        // Spread evenly across the 150-day history
        const daysAgo = Math.floor((n + 1) * HISTORY_DAYS / (numScores + 1))
        const occurredDate = daysBeforeEnd(endDate, daysAgo)
        // ~10% excused with null numericValue, ~90% graded with 70-100
        const roll = stableHash('state', hhIdx, learnerIdx, subjectIdx, n) % 100
        const isExcused = roll < 10
        const numericVal = isExcused
          ? null
          : String(70 + stableHash('grade', hhIdx, learnerIdx, subjectIdx, n) % 31)
        scoresRows.push({
          id: `score_demo_${hhIdx}_${learnerIdx}_${subjectIdx}_${n}`,
          householdId: cfg.householdId,
          learnerId: lc.id,
          subjectId: sub.id,
          lessonTaskId: null,
          state: isExcused ? 'excused' : 'graded',
          numericValue: numericVal,
          source: 'parent',
          occurredAt: new Date(`${occurredDate}T12:00:00Z`),
          comment: null,
          createdAt: seedNow,
          updatedAt: seedNow,
        })
      }
    }
  }

  // ── Compliance deadlines: 3 per demo household for the school year ──
  const deadlineTemplates = [
    { label: 'Annual notification', dueDate: '2025-09-01', requirementType: 'filing' },
    { label: 'Portfolio submission', dueDate: '2026-04-15', requirementType: 'portfolio' },
    { label: 'Year-end assessment', dueDate: '2026-05-30', requirementType: 'assessment' },
  ]
  for (let n = 0; n < deadlineTemplates.length; n++) {
    const tmpl = deadlineTemplates[n]
    complianceDeadlinesRows.push({
      id: `deadline_demo_${hhIdx}_${n}`,
      householdId: cfg.householdId,
      schoolYearId: cfg.schoolYearId,
      label: tmpl.label,
      dueDate: tmpl.dueDate,
      isCompleted: n === 0, // Annual notification already completed
      requirementType: tmpl.requirementType,
      createdAt: seedNow,
      updatedAt: seedNow,
    })
  }

  // ── Badge awards: 2-3 starter badges per learner ──
  for (let learnerIdx = 0; learnerIdx < cfg.learners.length; learnerIdx++) {
    const lc = cfg.learners[learnerIdx]
    // Pick 2-3 badges deterministically per learner
    const numBadges = 2 + stableHash('nbadges', hhIdx, learnerIdx) % 2
    for (let badgeIdx = 0; badgeIdx < numBadges; badgeIdx++) {
      const starterIdx = stableHash('badge', hhIdx, learnerIdx, badgeIdx) % STARTER_BADGE_IDS.length
      const badgeId = STARTER_BADGE_IDS[starterIdx]
      // Use a date within the 150-day history for approvedAt
      const daysAgo = 20 + stableHash('badgedate', hhIdx, learnerIdx, badgeIdx) % 100
      const approvedDate = daysBeforeEnd(endDate, daysAgo)
      badgeAwardsRows.push({
        id: `award_demo_${hhIdx}_${learnerIdx}_${badgeIdx}`,
        householdId: cfg.householdId,
        learnerId: lc.id,
        badgeId,
        status: 'verified',
        submittedAt: new Date(`${approvedDate}T10:00:00Z`),
        verifiedAt: new Date(`${approvedDate}T12:00:00Z`),
        approvedAt: new Date(`${approvedDate}T12:00:00Z`),
        createdAt: seedNow,
        updatedAt: seedNow,
      })
    }
  }

  return { scores: scoresRows, complianceDeadlines: complianceDeadlinesRows, badgeAwards: badgeAwardsRows }
}

function buildHouseholdRows(
  cfg: HouseholdSeedConfig,
  endDate: string,
  seedNow: Date,
): Omit<DemoSeedPayload, 'users' | 'householdMembers' | 'scores' | 'complianceDeadlines' | 'badgeAwards'> {
  const householdId = cfg.householdId
  const profile = getHouseholdProfile(cfg.hhKey)

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

  // Barakah Academy: power user, 5 kids, heavy Quran focus, high engagement
  // Crescent Cove: lighter user, 3 kids, more casual adoption, came from a co-op
  const pvData = cfg.isAdmin
    ? {
        scores: { prev: 8, improvement: 9, ease: 8, trust: 9, retention: 9, pay: 7, referral: 9, clarity: 8, fork: '8.75' },
        householdOrProgramType: 'single_family' as const,
        usageDuration: '3_to_6_months',
        usedFeatureAreas: ['dashboard', 'planner', 'attendance', 'quran', 'portfolio'],
        pricingNotes: "Worth it for five kids — I'd pay more if offline mode was added",
        replacedWhat: 'A mix of Google Sheets, a paper planner, and a separate Quran tracker app',
        mostUseful: 'The daily planner and Quran session log — saves me 20 minutes every morning',
        confusingOrBurdensome: 'Setting up all five learners with their subjects at the start took a while',
        mustHaveChange: 'Offline mode so we can log work without wifi during road trips',
        lostAccessReaction: "I'd genuinely panic — our whole school day runs through this now",
        recommendTo: 'Any homeschool parent juggling multiple kids and Quran memorisation',
        referralMessage: 'Nothing else tracks attendance, lessons, and Quran together in one place',
        additionalNotes: null,
        mayContact: true,
        mayQuoteAnonymized: true,
        mayQuoteWithName: false,
      }
    : {
        scores: { prev: 6, improvement: 7, ease: 9, trust: 8, retention: 8, pay: 8, referral: 7, clarity: 6, fork: '7.50' },
        householdOrProgramType: 'co_op' as const,
        usageDuration: '1_to_3_months',
        usedFeatureAreas: ['dashboard', 'attendance', 'planner'],
        pricingNotes: "A bit high for us right now — we only use a few features",
        replacedWhat: 'A shared Google Doc our co-op used for attendance and a paper lesson journal',
        mostUseful: 'Attendance — finally have a proper record instead of a notebook I kept losing',
        confusingOrBurdensome: 'The portfolio section felt like extra work when we mostly just need attendance',
        mustHaveChange: 'A simpler quick-log view for days when I just need to mark present and move on',
        lostAccessReaction: "I'd go back to the Google Doc — annoying but we'd manage",
        recommendTo: 'Homeschool parents who want proper attendance records without a big spreadsheet',
        referralMessage: "It's the easiest way I've found to keep attendance records that actually look official",
        additionalNotes: 'We might use more features once the kids are older',
        mayContact: true,
        mayQuoteAnonymized: true,
        mayQuoteWithName: true,
      }

  const productValidationRows: (typeof productValidationResponses.$inferInsert)[] = [{
    id: cfg.productValId,
    userId: cfg.userId,
    householdId: null,
    tenantId: householdId,
    respondentName: cfg.userName,
    respondentEmail: cfg.email,
    respondentType: 'homeschool_parent',
    householdOrProgramType: pvData.householdOrProgramType,
    usageDuration: pvData.usageDuration,
    usedFeatureAreas: pvData.usedFeatureAreas,
    previousPainScore: pvData.scores.prev,
    improvementScore: pvData.scores.improvement,
    easeScore: pvData.scores.ease,
    trustScore: pvData.scores.trust,
    retentionScore: pvData.scores.retention,
    payScore: pvData.scores.pay,
    referralScore: pvData.scores.referral,
    positioningClarityScore: pvData.scores.clarity,
    reasonableMonthlyPriceBucket: profile.priceBucket,
    pricingNotes: pvData.pricingNotes,
    replacedWhat: pvData.replacedWhat,
    mostUseful: pvData.mostUseful,
    confusingOrBurdensome: pvData.confusingOrBurdensome,
    mustHaveChange: pvData.mustHaveChange,
    lostAccessReaction: pvData.lostAccessReaction,
    recommendTo: pvData.recommendTo,
    referralMessage: pvData.referralMessage,
    additionalNotes: pvData.additionalNotes,
    mayContact: pvData.mayContact,
    mayQuoteAnonymized: pvData.mayQuoteAnonymized,
    mayQuoteWithName: pvData.mayQuoteWithName,
    forkTestFitScore: pvData.scores.fork,
    createdAt: seedNow,
    updatedAt: seedNow,
  }]

  const history = buildHistoryRows(cfg, profile, endDate, seedNow)

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
    resources: [],
    ...history,
  }
}

function buildSeedResources(
  householdId: string,
  seedNow: Date,
): (typeof resources.$inferInsert)[] {
  type R = typeof resources.$inferInsert
  const base = (id: string, title: string, resourceType: string, subjectCategory: string, extra: Partial<R> = {}): R => ({
    id: `res_${householdId}_${id}`,
    householdId,
    title,
    resourceType,
    subjectCategory,
    publisher: null,
    author: null,
    edition: null,
    gradeLevel: null,
    isbn: null,
    totalPages: null,
    totalLessons: null,
    totalChapters: null,
    verificationStatus: 'user-submitted',
    createdAt: seedNow,
    updatedAt: seedNow,
    ...extra,
  })

  return [
    base('001', 'Math Mammoth Light Blue Grade 4', 'textbook', 'Mathematics', { publisher: 'Math Mammoth', author: 'Maria Miller', gradeLevel: '4', totalPages: 320, totalChapters: 8 }),
    base('002', 'All About Reading Level 2', 'reader', 'Language Arts', { publisher: 'All About Learning Press', gradeLevel: '2', totalPages: 180, totalLessons: 24, verificationStatus: 'verified' }),
    base('003', 'Khan Academy — Elementary Math', 'online-course', 'Mathematics', { publisher: 'Khan Academy', totalLessons: 60 }),
    base('004', "Quran with Tajweed — Hafs 'an 'Asim", 'quran-text', 'Islamic Studies', { totalPages: 604, verificationStatus: 'verified' }),
    base('005', 'Story of the World Vol. 2: The Middle Ages', 'textbook', 'History', { publisher: 'Peace Hill Press', author: 'Susan Wise Bauer', gradeLevel: '5-8', totalPages: 360, totalChapters: 42 }),
  ]
}

/** Builds the full demo payload in memory — zero database calls. */
export function buildDemoSeedPayload(
  configs: HouseholdSeedConfig[],
  seedNow = new Date(),
  endDate = seedHistoryEndDate(seedNow),
): DemoSeedPayload {
  const usersRows: (typeof users.$inferInsert)[] = configs.map(cfg => ({
    id: cfg.userId,
    email: cfg.email,
    name: cfg.userName,
    role: cfg.isAdmin ? 'admin' : 'user',
    createdVia: 'seed',
    createdAt: seedNow,
    updatedAt: seedNow,
  }))

  const payload: DemoSeedPayload = {
    users: usersRows,
    households: [],
    householdMembers: [],
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
    resources: [],
    scores: [],
    complianceDeadlines: [],
    badgeAwards: [],
  }

  for (let hhIdx = 0; hhIdx < configs.length; hhIdx++) {
    const cfg = configs[hhIdx]
    const householdRows = buildHouseholdRows(cfg, endDate, seedNow)
    payload.households.push(...householdRows.households)
    payload.householdMembers.push({
      id: `hm_seed_${cfg.householdId}`,
      householdId: cfg.householdId,
      userId: cfg.userId,
      role: 'owner',
      createdAt: seedNow,
      updatedAt: seedNow,
    })
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
    payload.resources.push(...buildSeedResources(cfg.householdId, seedNow))

    const newRows = buildNewTableRows(cfg, hhIdx, endDate, seedNow)
    payload.scores.push(...newRows.scores)
    payload.complianceDeadlines.push(...newRows.complianceDeadlines)
    payload.badgeAwards.push(...newRows.badgeAwards)
  }

  return payload
}

export function summarizePayload(payload: DemoSeedPayload): Record<string, number> {
  return {
    users: payload.users.length,
    households: payload.households.length,
    householdMembers: payload.householdMembers.length,
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
    resources: payload.resources.length,
    scores: payload.scores.length,
    complianceDeadlines: payload.complianceDeadlines.length,
    badgeAwards: payload.badgeAwards.length,
  }
}

/** Count rows for one household id — useful in tests. */
export function countForHousehold(payload: DemoSeedPayload, householdId: string) {
  return {
    attendance: payload.attendanceEvents.filter(r => r.householdId === householdId).length,
    lessons: payload.lessonTasks.filter(r => r.householdId === householdId).length,
    quran: payload.quranSessions.filter(r => r.householdId === householdId).length,
    evidence: payload.portfolioEvidence.filter(r => r.householdId === householdId).length,
  }
}

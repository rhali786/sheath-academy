/**
 * Seeds two demo households with 90 days of rich history.
 * Run with: npm run db:seed:demo
 *
 * Prerequisite: run the wipe migration (0003_wipe_app_data.sql) first.
 * Idempotent: all inserts use onConflictDoNothing with stable IDs.
 *
 * Household A — Barakah Academy      dev bypass user (DEV_SEED_USER_EMAIL)
 * Household B — Crescent Cove Learning   amina@gmail.com (DEMO_PARENT_B_EMAIL)
 */

import { eq } from 'drizzle-orm'
import { getDevSeedUserEmail } from '../features/lib/server/devUserEmail'
import { DEV_PG_SEED, DEMO_B_PG_SEED } from '../features/lib/seedIds'
import { upsertUserByEmail, upsertHouseholdForUser } from '../features/household/server/repository'
import { upsertLearner } from '../features/children/server/repository'
import { upsertSubjectRow } from '../features/subjects/server/repository'
import { upsertLessonTaskRow } from '../features/plan/server/repository'
import { upsertAttendanceEvent } from '../features/attendance/server/repository'
import { upsertQuranSessionRow } from '../features/quran/server/repository'
import { upsertEvidenceRow } from '../features/portfolio/server/repository'
import { setHouseholdSetting, setUserSetting } from '../features/settings/server/repository'
import { getDb } from '../features/lib/server/db'
import { users, schoolYears, productValidationResponses } from '../db/schema'

// ─── Types ───────────────────────────────────────────────────────────────────

interface SubjectConfig {
  id: string
  name: string
  category: string
}

interface LearnerConfig {
  id: string
  key: string
  name: string
  gradeLevel: string
  sortOrder: number
  subjects: SubjectConfig[]
}

interface HouseholdSeedConfig {
  userId: string
  householdId: string
  email: string
  userName: string
  householdName: string
  isAdmin: boolean
  schoolYearId: string
  productValId: string
  learners: LearnerConfig[]
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

function daysAgo(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function isWeekday(dateStr: string): boolean {
  const day = new Date(dateStr + 'T12:00:00Z').getUTCDay()
  return day >= 1 && day <= 5
}

// ─── History generation ───────────────────────────────────────────────────────

const HISTORY_DAYS = 150

const TASK_TITLES: Record<string, string[]> = {
  Mathematics:  ['Complete worksheet 1–5', 'Review multiplication tables', 'Practice fractions', 'Word problems set A', 'Mental math drills'],
  Quran:        ['Memorise Al-Fatiha verse', 'Review Al-Baqarah 1–5', 'Tajweed practice', 'Recitation check', 'Surah revision'],
  Arabic:       ['Vocabulary review', 'Grammar worksheet', 'Reading passage', 'Writing practice', 'Dictation exercise'],
  Science:      ['Read chapter 3', 'Lab observation notes', 'Diagram labelling', 'Vocabulary quiz', 'Research summary'],
  Reading:      ['Read pages 1–10', 'Comprehension questions', 'Vocabulary notebook', 'Book report draft', 'Reading log entry'],
  History:      ['Timeline activity', 'Map exercise', 'Research notes', 'Summary writing', 'Document analysis'],
  Writing:      ['Journal entry', 'Essay draft', 'Grammar practice', 'Sentence expansion', 'Editing checklist'],
  Art:          ['Sketch project', 'Colour theory worksheet', 'Portfolio piece', 'Art history notes', 'Still-life drawing'],
}

const SURAHS = ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran', 'An-Nisa', 'Al-Maidah', 'Al-Anam']
const SESSION_TYPES = ['memorization', 'revision', 'recitation']

async function seedHistory(hhKey: string, householdId: string, learners: LearnerConfig[]) {
  for (let offset = HISTORY_DAYS; offset >= 1; offset--) {
    const dateStr = daysAgo(offset)
    const weekday = isWeekday(dateStr)

    for (const lc of learners) {
      const quranSub = lc.subjects.find(s => s.category === 'quran')

      // ── Attendance (weekdays) ────────────────────────────────────────────
      if (weekday) {
        const attStatus =
          offset % 11 === 0 ? 'excused' :
          offset % 7 === 0  ? 'partial' :
          'present'
        const minutes =
          attStatus === 'present' ? 360 :
          attStatus === 'partial' ? 300 :
          undefined

        await upsertAttendanceEvent(
          householdId,
          `att_${hhKey}_${lc.key}_${dateStr}`,
          { learnerId: lc.id, attendanceDate: dateStr, status: attStatus, minutes },
        )
      }

      // ── Lesson tasks (every 2nd offset) ─────────────────────────────────
      if (offset % 2 === 0) {
        const subIdx = Math.floor(offset / 2) % lc.subjects.length
        const sub = lc.subjects[subIdx]
        const titles = TASK_TITLES[sub.name] ?? ['Complete assignment', 'Review material', 'Assessment prep']
        const titleIdx = Math.floor(offset / 2) % titles.length
        const taskStatus =
          offset > 14 ? 'completed' :
          offset > 7  ? 'in_progress' :
          'not_started'
        const completedAt = taskStatus === 'completed' ? new Date(`${dateStr}T15:00:00Z`) : undefined

        await upsertLessonTaskRow(
          householdId,
          `lt_${hhKey}_${lc.key}_${sub.id.slice(-8)}_o${offset}`,
          {
            learnerId: lc.id,
            subjectId: sub.id,
            title: titles[titleIdx],
            dueDate: dateStr,
            status: taskStatus,
            completedAt,
          },
        )
      }

      // ── Quran sessions (every 3rd offset, Quran learners only) ──────────
      if (offset % 3 === 0 && quranSub) {
        const surahIdx = Math.floor(offset / 3) % SURAHS.length
        const typeIdx  = Math.floor(offset / 3) % SESSION_TYPES.length

        await upsertQuranSessionRow(
          householdId,
          `qur_${hhKey}_${lc.key}_o${offset}`,
          {
            learnerId: lc.id,
            sessionDate: dateStr,
            sessionType: SESSION_TYPES[typeIdx],
            surah: SURAHS[surahIdx],
            fromAyah: 1,
            toAyah: 5 + (offset % 5),
            durationMinutes: 20 + (offset % 3) * 10,
          },
        )
      }

      // ── Portfolio evidence (every 30 days across the 150-day window) ─────
      if (offset % 30 === 0) {
        const monthIdx = (offset / 30) - 1
        const monthLabels = ['march', 'february', 'january', 'december', 'november']
        const monthLabel = monthLabels[monthIdx] ?? `month_${monthIdx + 1}`
        const sub = lc.subjects[monthIdx % lc.subjects.length]
        const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)

        await upsertEvidenceRow(
          householdId,
          `ev_${hhKey}_${lc.key}_${monthLabel}`,
          {
            learnerId: lc.id,
            subjectId: sub.id,
            title: `${sub.name} — ${cap(monthLabel)} portfolio`,
            description: `Monthly work sample for ${sub.name}`,
            evidenceType: 'work_sample',
            evidenceDate: dateStr,
          },
        )
      }
    }
  }
}

// ─── Per-household seed ───────────────────────────────────────────────────────

async function seedHousehold(cfg: HouseholdSeedConfig, hhKey: string) {
  const db = getDb()
  const now = new Date()

  const user = await upsertUserByEmail(cfg.email, cfg.userName, cfg.userId)
  if (cfg.isAdmin) {
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, user.id))
  }

  const household = await upsertHouseholdForUser(user.id, cfg.householdName, cfg.householdId)
  console.log(`  ${cfg.householdName} — ${household.id}`)

  // School year
  await db
    .insert(schoolYears)
    .values({
      id: cfg.schoolYearId,
      householdId: household.id,
      name: '2025–2026',
      startDate: '2025-08-25',
      endDate: '2026-06-12',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()

  // Household and user settings
  await setHouseholdSetting(household.id, 'onboarding_completed', true)
  await setHouseholdSetting(household.id, 'curriculum_year', '2025-2026')
  await setHouseholdSetting(household.id, 'default_session_minutes', 360)
  await setUserSetting(user.id, 'notifications_enabled', true)
  await setUserSetting(user.id, 'theme', 'system')

  // Learners and their subjects
  for (const lc of cfg.learners) {
    await upsertLearner(household.id, lc.id, {
      name: lc.name,
      gradeLevel: lc.gradeLevel,
      sortOrder: lc.sortOrder,
    })
    for (const sub of lc.subjects) {
      await upsertSubjectRow(household.id, sub.id, {
        name: sub.name,
        category: sub.category,
        learnerId: lc.id,
      })
    }
  }

  // 90-day history
  await seedHistory(hhKey, household.id, cfg.learners)

  // Product validation response
  const scores = cfg.isAdmin
    ? { prev: 8, improvement: 9, ease: 8, trust: 9, retention: 9, pay: 7, referral: 9, clarity: 8, fork: '8.75' }
    : { prev: 7, improvement: 8, ease: 9, trust: 8, retention: 9, pay: 8, referral: 8, clarity: 7, fork: '8.13' }

  await db
    .insert(productValidationResponses)
    .values({
      id: cfg.productValId,
      userId: user.id,
      tenantId: household.id,
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
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()

  console.log(`  ✓ history + validation seeded`)
}

// ─── Household configs ────────────────────────────────────────────────────────

async function main() {
  const devEmail = getDevSeedUserEmail()
  const aminaEmail = process.env.DEMO_PARENT_B_EMAIL ?? 'amina@gmail.com'

  console.log('db:seed:demo — seeding two demo households (90-day history)')
  console.log(`  Household A: ${devEmail}`)
  console.log(`  Household B: ${aminaEmail}`)

  await seedHousehold(
    {
      userId: DEV_PG_SEED.userId,
      householdId: DEV_PG_SEED.householdId,
      email: devEmail,
      userName: 'Dev User',
      householdName: 'Barakah Academy',
      isAdmin: true,
      schoolYearId: DEV_PG_SEED.schoolYear,
      productValId: DEV_PG_SEED.productVal,
      learners: [
        {
          id: DEV_PG_SEED.layth,
          key: 'layth',
          name: 'Layth',
          gradeLevel: 'Grade 4',
          sortOrder: 0,
          subjects: [
            { id: DEV_PG_SEED.subLaythMath,    name: 'Mathematics', category: 'core'       },
            { id: DEV_PG_SEED.subLaythQuran,   name: 'Quran',       category: 'quran'      },
            { id: DEV_PG_SEED.subLaythArabic,  name: 'Arabic',      category: 'language'   },
            { id: DEV_PG_SEED.subLaythScience, name: 'Science',     category: 'core'       },
          ],
        },
        {
          id: DEV_PG_SEED.hawa,
          key: 'hawa',
          name: 'Hawa',
          gradeLevel: 'Grade 1',
          sortOrder: 1,
          subjects: [
            { id: DEV_PG_SEED.subHawaMath,    name: 'Mathematics', category: 'core'  },
            { id: DEV_PG_SEED.subHawaReading, name: 'Reading',     category: 'core'  },
            { id: DEV_PG_SEED.subHawaQuran,   name: 'Quran',       category: 'quran' },
          ],
        },
        {
          id: DEV_PG_SEED.idris,
          key: 'idris',
          name: 'Idris',
          gradeLevel: 'Grade 2',
          sortOrder: 2,
          subjects: [
            { id: DEV_PG_SEED.subIdrisMath,    name: 'Mathematics', category: 'core'        },
            { id: DEV_PG_SEED.subIdrisQuran,   name: 'Quran',       category: 'quran'       },
            { id: DEV_PG_SEED.subIdrisHistory, name: 'History',     category: 'enrichment'  },
          ],
        },
        {
          id: DEV_PG_SEED.safiya,
          key: 'safiya',
          name: 'Safiya',
          gradeLevel: 'Grade 3',
          sortOrder: 3,
          subjects: [
            { id: DEV_PG_SEED.subSafiyaMath,    name: 'Mathematics', category: 'core'  },
            { id: DEV_PG_SEED.subSafiyaQuran,   name: 'Quran',       category: 'quran' },
            { id: DEV_PG_SEED.subSafiyaWriting, name: 'Writing',     category: 'core'  },
          ],
        },
        {
          id: DEV_PG_SEED.hamza,
          key: 'hamza',
          name: 'Hamza',
          gradeLevel: 'Kindergarten',
          sortOrder: 4,
          subjects: [
            { id: DEV_PG_SEED.subHamzaMath,    name: 'Mathematics', category: 'core' },
            { id: DEV_PG_SEED.subHamzaReading, name: 'Reading',     category: 'core' },
            { id: DEV_PG_SEED.subHamzaArt,     name: 'Art',         category: 'enrichment' },
          ],
        },
      ],
    },
    'a',
  )

  await seedHousehold(
    {
      userId: DEMO_B_PG_SEED.userId,
      householdId: DEMO_B_PG_SEED.householdId,
      email: aminaEmail,
      userName: 'Amina',
      householdName: 'Crescent Cove Learning',
      isAdmin: false,
      schoolYearId: DEMO_B_PG_SEED.schoolYear,
      productValId: DEMO_B_PG_SEED.productVal,
      learners: [
        {
          id: DEMO_B_PG_SEED.khalid,
          key: 'khalid',
          name: 'Khalid',
          gradeLevel: 'Grade 5',
          sortOrder: 0,
          subjects: [
            { id: DEMO_B_PG_SEED.subKhalidMath,    name: 'Mathematics', category: 'core'        },
            { id: DEMO_B_PG_SEED.subKhalidQuran,   name: 'Quran',       category: 'quran'       },
            { id: DEMO_B_PG_SEED.subKhalidScience, name: 'Science',     category: 'core'        },
            { id: DEMO_B_PG_SEED.subKhalidHistory, name: 'History',     category: 'enrichment'  },
          ],
        },
        {
          id: DEMO_B_PG_SEED.zaynab,
          key: 'zaynab',
          name: 'Zaynab',
          gradeLevel: 'Grade 3',
          sortOrder: 1,
          subjects: [
            { id: DEMO_B_PG_SEED.subZaynabMath,    name: 'Mathematics', category: 'core'        },
            { id: DEMO_B_PG_SEED.subZaynabQuran,   name: 'Quran',       category: 'quran'       },
            { id: DEMO_B_PG_SEED.subZaynabWriting, name: 'Writing',     category: 'core'        },
            { id: DEMO_B_PG_SEED.subZaynabArabic,  name: 'Arabic',      category: 'language'    },
          ],
        },
        {
          id: DEMO_B_PG_SEED.maryam,
          key: 'maryam',
          name: 'Maryam',
          gradeLevel: 'Kindergarten',
          sortOrder: 2,
          subjects: [
            { id: DEMO_B_PG_SEED.subMaryamMath,    name: 'Mathematics', category: 'core' },
            { id: DEMO_B_PG_SEED.subMaryamReading, name: 'Reading',     category: 'core' },
          ],
        },
        {
          id: DEMO_B_PG_SEED.yusuf,
          key: 'yusuf',
          name: 'Yusuf',
          gradeLevel: 'Grade 2',
          sortOrder: 3,
          subjects: [
            { id: DEMO_B_PG_SEED.subYusufMath,  name: 'Mathematics', category: 'core'  },
            { id: DEMO_B_PG_SEED.subYusufQuran, name: 'Quran',       category: 'quran' },
          ],
        },
        {
          id: DEMO_B_PG_SEED.bilal,
          key: 'bilal',
          name: 'Bilal',
          gradeLevel: 'Grade 1',
          sortOrder: 4,
          subjects: [
            { id: DEMO_B_PG_SEED.subBilalMath,    name: 'Mathematics', category: 'core'  },
            { id: DEMO_B_PG_SEED.subBilalReading, name: 'Reading',     category: 'core'  },
            { id: DEMO_B_PG_SEED.subBilalQuran,   name: 'Quran',       category: 'quran' },
          ],
        },
      ],
    },
    'b',
  )

  console.log('\ndb:seed:demo — done')
  console.log('Sign in as dev bypass or amina@gmail.com (magic link) to see the data.')
  process.exit(0)
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

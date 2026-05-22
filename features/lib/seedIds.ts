export const SEED_IDS = {
  workspace: 'workspace_seed_001',
  household: 'household_seed_001',
  layth: 'student_seed_layth_001',
  hawa: 'student_seed_hawa_001',
  talut: 'student_seed_talut_001',
  samurai: 'student_seed_samurai_001',
  schoolYear: 'schoolyear_seed_001',
} as const

/** Stable Postgres IDs for `npm run db:seed:dev` (idempotent). */
export const DEV_PG_SEED = {
  userId: 'user_seed_dev',
  householdId: SEED_IDS.household,
  layth: SEED_IDS.layth,
  hawa: SEED_IDS.hawa,
  mathSubject: 'subject_seed_math',
  quranSubject: 'subject_seed_quran',
  quranSessionToday: 'quran_session_seed_fatiha_today',
} as const

/** Stable Postgres IDs for isolation QA users (`npm run db:seed:isolation`). */
export const ISOLATION_PG_SEED = {
  userA: 'user_seed_isolation_a',
  householdA: 'household_seed_isolation_a',
  learnerA: 'learner_seed_isolation_a',
  userB: 'user_seed_isolation_b',
  householdB: 'household_seed_isolation_b',
  learnerB: 'learner_seed_isolation_b',
} as const

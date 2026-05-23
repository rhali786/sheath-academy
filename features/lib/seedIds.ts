export const SEED_IDS = {
  workspace: 'workspace_seed_001',
  household: 'household_seed_001',
  layth: 'student_seed_layth_001',
  hawa: 'student_seed_hawa_001',
  talut: 'student_seed_talut_001',
  samurai: 'student_seed_samurai_001',
  schoolYear: 'schoolyear_seed_001',
} as const

/** Stable Postgres IDs for Household A — dev bypass user (npm run db:seed:demo). */
export const DEV_PG_SEED = {
  userId: 'user_seed_dev',
  householdId: SEED_IDS.household,
  // learners
  layth: SEED_IDS.layth,
  hawa: SEED_IDS.hawa,
  idris: 'learner_seed_idris',
  safiya: 'learner_seed_safiya',
  hamza: 'learner_seed_hamza',
  // subjects (prefix sub_a = household A)
  subLaythMath: 'sub_a_layth_math',
  subLaythQuran: 'sub_a_layth_quran',
  subLaythArabic: 'sub_a_layth_arabic',
  subLaythScience: 'sub_a_layth_science',
  subHawaMath: 'sub_a_hawa_math',
  subHawaReading: 'sub_a_hawa_reading',
  subHawaQuran: 'sub_a_hawa_quran',
  subIdrisMath: 'sub_a_idris_math',
  subIdrisQuran: 'sub_a_idris_quran',
  subIdrisHistory: 'sub_a_idris_history',
  subSafiyaMath: 'sub_a_safiya_math',
  subSafiyaQuran: 'sub_a_safiya_quran',
  subSafiyaWriting: 'sub_a_safiya_writing',
  subHamzaMath: 'sub_a_hamza_math',
  subHamzaReading: 'sub_a_hamza_reading',
  subHamzaArt: 'sub_a_hamza_art',
  // school year
  schoolYear: 'sy_seed_a_2526',
  // product validation
  productVal: 'pv_seed_dev',
  // legacy keys kept for existing scripts
  mathSubject: 'subject_seed_math',
  quranSubject: 'subject_seed_quran',
  quranSessionToday: 'quran_session_seed_fatiha_today',
} as const

/** Stable Postgres IDs for Household B — amina@gmail.com (npm run db:seed:demo). */
export const DEMO_B_PG_SEED = {
  userId: 'user_seed_amina',
  householdId: 'household_seed_amina',
  // learners
  khalid: 'learner_seed_khalid',
  zaynab: 'learner_seed_zaynab',
  maryam: 'learner_seed_maryam',
  yusuf: 'learner_seed_yusuf_b',
  // subjects (prefix sub_b = household B)
  subKhalidMath: 'sub_b_khalid_math',
  subKhalidQuran: 'sub_b_khalid_quran',
  subKhalidScience: 'sub_b_khalid_science',
  subKhalidHistory: 'sub_b_khalid_history',
  subZaynabMath: 'sub_b_zaynab_math',
  subZaynabQuran: 'sub_b_zaynab_quran',
  subZaynabWriting: 'sub_b_zaynab_writing',
  subZaynabArabic: 'sub_b_zaynab_arabic',
  subMaryamMath: 'sub_b_maryam_math',
  subMaryamReading: 'sub_b_maryam_reading',
  subYusufMath: 'sub_b_yusuf_math',
  subYusufQuran: 'sub_b_yusuf_quran',
  bilal: 'learner_seed_bilal',
  subBilalMath: 'sub_b_bilal_math',
  subBilalReading: 'sub_b_bilal_reading',
  subBilalQuran: 'sub_b_bilal_quran',
  // school year
  schoolYear: 'sy_seed_b_2526',
  // product validation
  productVal: 'pv_seed_amina',
} as const

/** Stable Postgres IDs for isolation QA users (kept for e2e/auth-isolation.spec.ts reference). */
export const ISOLATION_PG_SEED = {
  userA: 'user_seed_isolation_a',
  householdA: 'household_seed_isolation_a',
  learnerA: 'learner_seed_isolation_a',
  userB: 'user_seed_isolation_b',
  householdB: 'household_seed_isolation_b',
  learnerB: 'learner_seed_isolation_b',
} as const

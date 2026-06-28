import type { Score, SubjectGradeResult, GradebookSummary, NeedsAttentionItem } from '@/features/gradebook/types'
import { SEED_IDS, DEV_PG_SEED } from '@/features/lib/seedIds'

export const mockScores: Score[] = [
  {
    id: 'score_fix_001',
    subjectId: DEV_PG_SEED.subLaythMath,
    learnerId: SEED_IDS.layth,
    householdId: SEED_IDS.household,
    state: 'graded',
    numericValue: 88,
    source: 'parent',
    occurredAt: '2026-05-01',
    comment: 'Strong multiplication',
  },
  {
    id: 'score_fix_002',
    subjectId: DEV_PG_SEED.subLaythMath,
    learnerId: SEED_IDS.layth,
    householdId: SEED_IDS.household,
    state: 'graded',
    numericValue: 92,
    source: 'parent',
    occurredAt: '2026-05-15',
  },
  // missing score — must never count as 0
  {
    id: 'score_fix_003',
    subjectId: DEV_PG_SEED.subLaythQuran,
    learnerId: SEED_IDS.layth,
    householdId: SEED_IDS.household,
    state: 'missing',
    numericValue: null,
    source: 'parent',
    occurredAt: '2026-05-10',
  },
  // excused — must never count as 0
  {
    id: 'score_fix_004',
    subjectId: DEV_PG_SEED.subLaythArabic,
    learnerId: SEED_IDS.layth,
    householdId: SEED_IDS.household,
    state: 'excused',
    numericValue: null,
    source: 'parent',
    occurredAt: '2026-05-12',
  },
  // Hawa — sparse (only one score)
  {
    id: 'score_fix_005',
    subjectId: DEV_PG_SEED.subHawaMath,
    learnerId: SEED_IDS.hawa,
    householdId: SEED_IDS.household,
    state: 'graded',
    numericValue: 76,
    source: 'parent',
    occurredAt: '2026-05-08',
  },
]

const laythMathSubject: SubjectGradeResult = {
  subjectId: DEV_PG_SEED.subLaythMath,
  label: 'Math',
  pointsAverage: 90,
  masteryAverage: 90,
  gradeLetter: 'A',
  creditHours: 1,
  needsReview: false,
}

const laythQuranSubject: SubjectGradeResult = {
  subjectId: DEV_PG_SEED.subLaythQuran,
  label: 'Quran',
  pointsAverage: null,
  masteryAverage: null,
  gradeLetter: null,
  creditHours: 1,
  needsReview: false,
}

const laythNeedsAttention: NeedsAttentionItem[] = [
  { subjectId: DEV_PG_SEED.subLaythQuran, label: 'Quran', reason: 'missing' },
]

export const mockGradebookSummaries: GradebookSummary[] = [
  {
    learnerId: SEED_IDS.layth,
    learnerName: 'Layth',
    gradeBand: 'g5_8',
    subjects: [laythMathSubject, laythQuranSubject],
    gpa: { weighted: 4.0, unweighted: 4.0, totalCreditHours: 1 },
    needsAttentionSubjects: [DEV_PG_SEED.subLaythQuran],
  },
  {
    learnerId: SEED_IDS.hawa,
    learnerName: 'Hawa',
    gradeBand: 'g1_4',
    subjects: [
      {
        subjectId: DEV_PG_SEED.subHawaMath,
        label: 'Math',
        pointsAverage: 76,
        masteryAverage: 76,
        gradeLetter: 'C',
        creditHours: 1,
        needsReview: false,
      },
    ],
    gpa: { weighted: 2.0, unweighted: 2.0, totalCreditHours: 1 },
    needsAttentionSubjects: [],
  },
  // Sparse learner — no scores yet
  {
    learnerId: SEED_IDS.talut,
    learnerName: 'Talut',
    gradeBand: 'g9_12',
    subjects: [],
    gpa: { weighted: null, unweighted: null, totalCreditHours: 0 },
    needsAttentionSubjects: [],
  },
]

export { laythNeedsAttention }

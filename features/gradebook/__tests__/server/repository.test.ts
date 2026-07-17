/** @jest-environment node */

// Repository-level test for listGradebookSummaries' active-school-year
// scoping (G2 — course rollover). Mocks getDb() directly, same precedent as
// features/gradebook/__tests__/server/overallMastery.test.ts: 5 sequential
// db.select().from().where() calls inside a Promise.all (learners, subjects,
// scores, gradingScales, aggregationRules), plus a 6th for the active
// school year lookup.

jest.mock('@/features/lib/server/db', () => ({ getDb: jest.fn() }))

import { getDb } from '@/features/lib/server/db'
const mockGetDb = getDb as jest.Mock

interface LearnerRow {
  id: string
  householdId: string
  name: string
  gradeLevel: string | null
}

interface SubjectRow {
  id: string
  householdId: string
  learnerId: string | null
  schoolYearId: string | null
  name: string
  creditHours: string | null
  aggregationRuleId: string | null
  gradingScaleId: string | null
  isActive?: boolean
  isFormalCourse?: boolean
  termModel?: string | null
}

interface ScoreRow {
  id: string
  householdId: string
  learnerId: string
  subjectId: string | null
  lessonTaskId: string | null
  state: string
  numericValue: string | null
  source: string
  occurredAt: Date
  comment: string | null
}

interface SchoolYearRow {
  id: string
  householdId: string
  isActive: boolean
}

function learner(overrides: Partial<LearnerRow> = {}): LearnerRow {
  return { id: 'learner_1', householdId: 'hh_1', name: 'Test Learner', gradeLevel: '6th', ...overrides }
}

function subject(overrides: Partial<SubjectRow> = {}): SubjectRow {
  return {
    id: 'sub_1',
    householdId: 'hh_1',
    learnerId: 'learner_1',
    schoolYearId: null,
    name: 'Subject',
    creditHours: null,
    aggregationRuleId: null,
    gradingScaleId: null,
    isActive: true,
    ...overrides,
  }
}

function scoreRow(overrides: Partial<ScoreRow> = {}): ScoreRow {
  return {
    id: `score_${Math.random()}`,
    householdId: 'hh_1',
    learnerId: 'learner_1',
    subjectId: 'sub_1',
    lessonTaskId: null,
    state: 'graded',
    numericValue: '90',
    source: 'parent',
    occurredAt: new Date('2026-05-01'),
    comment: null,
    ...overrides,
  }
}

function schoolYearRow(overrides: Partial<SchoolYearRow> = {}): SchoolYearRow {
  return { id: 'year_b', householdId: 'hh_1', isActive: true, ...overrides }
}

/**
 * listGradebookSummaries issues 6 sequential db.select().from().where() calls
 * inside a Promise.all: learners, subjects, scores, gradingScales,
 * aggregationRules, activeSchoolYear.
 */
function buildMockDb(sequence: unknown[][]) {
  let call = 0
  return {
    select: jest.fn(() => ({
      from: jest.fn(() => ({
        where: jest.fn(() => Promise.resolve(sequence[call++] ?? [])),
      })),
    })),
  }
}

beforeEach(() => {
  mockGetDb.mockReset()
})

describe('listGradebookSummaries — active-school-year scoping (G2 course rollover)', () => {
  it('excludes a rolled-over prior-year course row (still isActive) from the visible subject list and from GPA/needs-attention aggregation, counting only the current-year row', async () => {
    // Same course name rolled over: the source-year row (year_a) remains
    // isActive=true per the "hide but keep" decision, and the new
    // active-year row (year_b) is the one that should count.
    mockGetDb.mockReturnValue(
      buildMockDb([
        [learner()],
        [
          subject({ id: 'sub_year_a', schoolYearId: 'year_a', name: 'Algebra I', isActive: true }),
          subject({ id: 'sub_year_b', schoolYearId: 'year_b', name: 'Algebra I', isActive: true }),
        ],
        [
          // Scores on both the old and new year's row — only the new
          // year's row's scores should count toward GPA/mastery.
          scoreRow({ subjectId: 'sub_year_a', numericValue: '60' }),
          scoreRow({ subjectId: 'sub_year_b', numericValue: '90' }),
        ],
        [],
        [],
        [schoolYearRow({ id: 'year_b' })],
      ]),
    )

    const { listGradebookSummaries } = await import('@/features/gradebook/server/repository')
    const summaries = await listGradebookSummaries('hh_1')

    expect(summaries).toHaveLength(1)
    const [summary] = summaries

    // Only one subject row visible — the active-year (year_b) one.
    expect(summary.subjects).toHaveLength(1)
    expect(summary.subjects[0].subjectId).toBe('sub_year_b')

    // needsAttentionSubjects must not reference the hidden prior-year row.
    expect(summary.needsAttentionSubjects).not.toContain('sub_year_a')

    // GPA/mastery reflects only the current-year row's score (90), not an
    // average that includes the stale prior-year row's score (60).
    expect(summary.overallMastery).toBeCloseTo(90, 5)
  })

  it('includes legacy subjects with no schoolYearId even when an active year is set', async () => {
    mockGetDb.mockReturnValue(
      buildMockDb([
        [learner()],
        [subject({ id: 'sub_legacy', schoolYearId: null, name: 'Legacy Course', isActive: true })],
        [],
        [],
        [],
        [schoolYearRow({ id: 'year_b' })],
      ]),
    )

    const { listGradebookSummaries } = await import('@/features/gradebook/server/repository')
    const summaries = await listGradebookSummaries('hh_1')

    expect(summaries[0].subjects).toHaveLength(1)
    expect(summaries[0].subjects[0].subjectId).toBe('sub_legacy')
  })

  it('excludes an isActive=false (archived) subject regardless of school year', async () => {
    mockGetDb.mockReturnValue(
      buildMockDb([
        [learner()],
        [subject({ id: 'sub_archived', schoolYearId: 'year_b', name: 'Archived Course', isActive: false })],
        [],
        [],
        [],
        [schoolYearRow({ id: 'year_b' })],
      ]),
    )

    const { listGradebookSummaries } = await import('@/features/gradebook/server/repository')
    const summaries = await listGradebookSummaries('hh_1')

    expect(summaries[0].subjects).toHaveLength(0)
  })

  it('when no active school year exists, does not filter by school year (keeps prior no-op behavior, isActive scoping still applies)', async () => {
    mockGetDb.mockReturnValue(
      buildMockDb([
        [learner()],
        [
          subject({ id: 'sub_year_a', schoolYearId: 'year_a', name: 'Algebra I', isActive: true }),
          subject({ id: 'sub_year_b', schoolYearId: 'year_b', name: 'Algebra I', isActive: true }),
        ],
        [],
        [],
        [],
        [], // no active school year row
      ]),
    )

    const { listGradebookSummaries } = await import('@/features/gradebook/server/repository')
    const summaries = await listGradebookSummaries('hh_1')

    expect(summaries[0].subjects).toHaveLength(2)
  })
})

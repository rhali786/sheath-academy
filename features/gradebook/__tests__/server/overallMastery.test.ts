/** @jest-environment node */

// Unit test for listGradebookSummaries's overallMastery computation.
// Mocks getDb() directly (repository-level test, precedent:
// features/auth/__tests__/unit/passwordResetTokens.test.ts) rather than the
// repository boundary, since this test exercises the repository itself.

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
  name: string
  creditHours: string | null
  aggregationRuleId: string | null
  gradingScaleId: string | null
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

function learner(overrides: Partial<LearnerRow> = {}): LearnerRow {
  return { id: 'learner_1', householdId: 'hh_1', name: 'Test Learner', gradeLevel: '6th', ...overrides }
}

function subject(overrides: Partial<SubjectRow> = {}): SubjectRow {
  return {
    id: 'sub_1',
    householdId: 'hh_1',
    learnerId: 'learner_1',
    name: 'Subject',
    creditHours: null,
    aggregationRuleId: null,
    gradingScaleId: null,
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

/**
 * listGradebookSummaries issues 5 sequential db.select().from().where() calls
 * inside a Promise.all: learners, subjects, scores, gradingScales, aggregationRules.
 * This builds a fake db that returns each queued result set in that order.
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

describe('listGradebookSummaries — overallMastery', () => {
  it('is the average of non-null subject masteryAverage values', async () => {
    mockGetDb.mockReturnValue(
      buildMockDb([
        [learner()],
        [subject({ id: 'sub_a' }), subject({ id: 'sub_b' })],
        [
          scoreRow({ subjectId: 'sub_a', numericValue: '90' }),
          scoreRow({ subjectId: 'sub_b', numericValue: '70' }),
        ],
        [],
        [],
      ]),
    )

    const { listGradebookSummaries } = await import('@/features/gradebook/server/repository')
    const summaries = await listGradebookSummaries('hh_1')

    expect(summaries).toHaveLength(1)
    expect(summaries[0].overallMastery).toBeCloseTo(80, 5)
  })

  it('is null when a learner has no scored subjects', async () => {
    mockGetDb.mockReturnValue(
      buildMockDb([
        [learner()],
        [subject({ id: 'sub_a' })],
        [], // no scores at all
        [],
        [],
      ]),
    )

    const { listGradebookSummaries } = await import('@/features/gradebook/server/repository')
    const summaries = await listGradebookSummaries('hh_1')

    expect(summaries).toHaveLength(1)
    expect(summaries[0].overallMastery).toBeNull()
  })

  it('ignores subjects whose masteryAverage is null', async () => {
    mockGetDb.mockReturnValue(
      buildMockDb([
        [learner()],
        [subject({ id: 'sub_a' }), subject({ id: 'sub_b' })],
        // only sub_a has a score; sub_b has none → masteryAverage null, must be excluded
        [scoreRow({ subjectId: 'sub_a', numericValue: '80' })],
        [],
        [],
      ]),
    )

    const { listGradebookSummaries } = await import('@/features/gradebook/server/repository')
    const summaries = await listGradebookSummaries('hh_1')

    expect(summaries).toHaveLength(1)
    expect(summaries[0].overallMastery).toBeCloseTo(80, 5)
  })
})

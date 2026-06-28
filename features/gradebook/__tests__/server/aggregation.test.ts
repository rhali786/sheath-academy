import {
  computeSubjectGrade,
  computeGpa,
  masteryStatus,
  decayStatus,
} from '@/features/gradebook/server/aggregation'
import type { Score, SubjectGradingConfig } from '@/features/gradebook/types'

function score(numericValue: number | null, state: Score['state'] = 'graded', occurredAt = '2026-01-01'): Score {
  return {
    id: `s_${Math.random()}`,
    subjectId: 'sub1',
    learnerId: 'l1',
    householdId: 'hh1',
    state,
    numericValue,
    source: 'parent',
    occurredAt,
  }
}

describe('computeSubjectGrade — no-zero guarantee (US9)', () => {
  it('excludes missing scores from the average', () => {
    const scores = [score(80), score(null, 'missing')]
    const result = computeSubjectGrade('sub1', 'Math', scores)
    // missing never counts as 0; average is 80 not 40
    expect(result.pointsAverage).toBe(80)
  })

  it('excludes excused scores from the average', () => {
    const scores = [score(90), score(null, 'excused')]
    const result = computeSubjectGrade('sub1', 'Math', scores)
    expect(result.pointsAverage).toBe(90)
  })

  it('excludes not_graded scores from the average', () => {
    const scores = [score(70), score(null, 'not_graded')]
    const result = computeSubjectGrade('sub1', 'Math', scores)
    expect(result.pointsAverage).toBe(70)
  })

  it('returns null pointsAverage when all scores are non-graded', () => {
    const scores = [score(null, 'missing'), score(null, 'excused'), score(null, 'not_graded')]
    const result = computeSubjectGrade('sub1', 'Math', scores)
    expect(result.pointsAverage).toBeNull()
  })

  it('returns null when scores array is empty', () => {
    const result = computeSubjectGrade('sub1', 'Math', [])
    expect(result.pointsAverage).toBeNull()
  })

  it('computes average of graded scores only', () => {
    const scores = [score(80), score(100), score(60)]
    const result = computeSubjectGrade('sub1', 'Math', scores)
    expect(result.pointsAverage).toBeCloseTo(80, 5)
  })

  it('maps 90–100 → A, 80–89 → B, 70–79 → C, 60–69 → D, <60 → F', () => {
    expect(computeSubjectGrade('s', 'M', [score(95)]).gradeLetter).toBe('A')
    expect(computeSubjectGrade('s', 'M', [score(85)]).gradeLetter).toBe('B')
    expect(computeSubjectGrade('s', 'M', [score(75)]).gradeLetter).toBe('C')
    expect(computeSubjectGrade('s', 'M', [score(65)]).gradeLetter).toBe('D')
    expect(computeSubjectGrade('s', 'M', [score(50)]).gradeLetter).toBe('F')
  })

  it('returns null gradeLetter when no graded scores', () => {
    const result = computeSubjectGrade('sub1', 'Math', [score(null, 'missing')])
    expect(result.gradeLetter).toBeNull()
  })
})

describe('masteryStatus', () => {
  it('most_recent: returns most-recent score value', () => {
    const scores = [
      score(60, 'graded', '2026-01-01'),
      score(80, 'graded', '2026-03-01'),
      score(70, 'graded', '2026-02-01'),
    ]
    const result = masteryStatus(scores, 'most_recent')
    expect(result.score).toBe(80)
    expect(result.strategy).toBe('most_recent')
    expect(result.needsReview).toBe(false)
  })

  it('highest: returns highest score value', () => {
    const scores = [score(60), score(95), score(70)]
    const result = masteryStatus(scores, 'highest')
    expect(result.score).toBe(95)
  })

  it('decaying: returns decayed score and flags needsReview when last score dropped', () => {
    const scores = [
      score(90, 'graded', '2026-01-01'),
      score(70, 'graded', '2026-03-01'),
    ]
    const result = masteryStatus(scores, 'decaying')
    expect(result.score).toBe(70)
    expect(result.needsReview).toBe(true)
  })

  it('decaying: does not flag needsReview when last score is same or better', () => {
    const scores = [
      score(70, 'graded', '2026-01-01'),
      score(90, 'graded', '2026-03-01'),
    ]
    const result = masteryStatus(scores, 'decaying')
    expect(result.needsReview).toBe(false)
  })

  it('returns null score when no graded scores', () => {
    const result = masteryStatus([score(null, 'missing')], 'most_recent')
    expect(result.score).toBeNull()
  })
})

describe('decayStatus', () => {
  it('returns needsReview=true when latest < previous best', () => {
    const scores = [score(90, 'graded', '2026-01-01'), score(65, 'graded', '2026-03-01')]
    expect(decayStatus(scores)).toBe(true)
  })

  it('returns needsReview=false when latest >= previous best', () => {
    const scores = [score(65, 'graded', '2026-01-01'), score(90, 'graded', '2026-03-01')]
    expect(decayStatus(scores)).toBe(false)
  })

  it('returns false for single score', () => {
    expect(decayStatus([score(70)])).toBe(false)
  })

  it('returns false for empty scores', () => {
    expect(decayStatus([])).toBe(false)
  })
})

describe('computeGpa', () => {
  const config: SubjectGradingConfig[] = [
    { subjectId: 'sub1', label: 'Math', creditHours: 1 },
    { subjectId: 'sub2', label: 'English', creditHours: 1 },
  ]

  it('computes unweighted GPA on 4.0 scale', () => {
    // A=4, B=3, C=2, D=1, F=0
    // sub1: 95 → A → 4.0; sub2: 85 → B → 3.0 → avg 3.5
    const gradeMap = new Map([['sub1', 95], ['sub2', 85]])
    const result = computeGpa(config, gradeMap)
    expect(result.unweighted).toBeCloseTo(3.5, 5)
    expect(result.totalCreditHours).toBe(2)
  })

  it('returns null GPA when no subjects have grades', () => {
    const result = computeGpa(config, new Map())
    expect(result.unweighted).toBeNull()
    expect(result.weighted).toBeNull()
  })

  it('uses creditHours for weighted GPA when weights not set', () => {
    // weighted = (4.0*1 + 3.0*1) / 2 = 3.5
    const gradeMap = new Map([['sub1', 95], ['sub2', 85]])
    const result = computeGpa(config, gradeMap)
    expect(result.weighted).toBeCloseTo(3.5, 5)
  })

  it('missing/excused scores never affect GPA (no-zero guarantee)', () => {
    // sub2 has no numeric grade (missing) → only sub1 contributes
    const gradeMap = new Map([['sub1', 90]])
    const result = computeGpa(config, gradeMap)
    // Only 1 subject has a grade → GPA based on sub1 only
    expect(result.unweighted).toBeCloseTo(4.0, 5)
    expect(result.totalCreditHours).toBe(1)
  })
})

import type { Score, SubjectGradingConfig, SubjectGradeResult, GpaResult, MasteryStatus, MasteryStrategyType, GradingScaleBand, AggregationStrategy } from '@/features/gradebook/types'

/** The built-in 4.0 scale used when a subject references no custom grading scale. */
export const DEFAULT_GRADING_BANDS: GradingScaleBand[] = [
  { minPercent: 90, letter: 'A', gpaPoints: 4 },
  { minPercent: 80, letter: 'B', gpaPoints: 3 },
  { minPercent: 70, letter: 'C', gpaPoints: 2 },
  { minPercent: 60, letter: 'D', gpaPoints: 1 },
  { minPercent: 0, letter: 'F', gpaPoints: 0 },
]

/** Maps a numeric average to a letter + GPA points using the given bands (highest match wins). */
export function gradeFromBands(
  avg: number,
  bands: GradingScaleBand[] = DEFAULT_GRADING_BANDS,
): { letter: string; gpaPoints: number } {
  const sorted = [...bands].sort((a, b) => b.minPercent - a.minPercent)
  for (const band of sorted) {
    if (avg >= band.minPercent) return { letter: band.letter, gpaPoints: band.gpaPoints }
  }
  const lowest = sorted[sorted.length - 1]
  return { letter: lowest?.letter ?? 'F', gpaPoints: lowest?.gpaPoints ?? 0 }
}

/**
 * Collapses a subject's scores into a single representative numeric value using the
 * aggregation strategy. Non-graded states never count (US9). Returns null when there
 * are no graded scores.
 */
export function aggregateScore(scores: Score[], strategy: AggregationStrategy): number | null {
  const graded = gradedOnly(scores)
  if (graded.length === 0) return null
  if (strategy === 'most_recent') {
    const sorted = [...graded].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
    return sorted[sorted.length - 1].numericValue!
  }
  if (strategy === 'highest') {
    return Math.max(...graded.map(s => s.numericValue!))
  }
  return graded.reduce((sum, s) => sum + s.numericValue!, 0) / graded.length
}

/**
 * Credit-weighted GPA from precomputed per-subject GPA points (already mapped through
 * each subject's grading scale). `unweighted` averages the points evenly; `weighted`
 * weights by credit hours.
 */
export function computeGpaFromPoints(
  entries: { creditHours: number; points: number }[],
): GpaResult {
  if (entries.length === 0) return { weighted: null, unweighted: null, totalCreditHours: 0 }
  const totalCredits = entries.reduce((sum, e) => sum + (e.creditHours || 0), 0)
  const weightedPoints = entries.reduce((sum, e) => sum + e.points * (e.creditHours || 0), 0)
  const weighted = totalCredits > 0 ? weightedPoints / totalCredits : null
  const unweighted = entries.reduce((sum, e) => sum + e.points, 0) / entries.length
  return { weighted, unweighted: weighted ?? unweighted, totalCreditHours: totalCredits }
}

/** Grade letter thresholds */
function letterGrade(avg: number): string {
  if (avg >= 90) return 'A'
  if (avg >= 80) return 'B'
  if (avg >= 70) return 'C'
  if (avg >= 60) return 'D'
  return 'F'
}

/** 4.0-scale GPA point from percentage */
function gpaPoints(avg: number): number {
  if (avg >= 90) return 4.0
  if (avg >= 80) return 3.0
  if (avg >= 70) return 2.0
  if (avg >= 60) return 1.0
  return 0.0
}

/**
 * Filter to only graded scores (state === 'graded' with a numeric value).
 * Missing/excused/not_graded NEVER count as zero (US9).
 */
function gradedOnly(scores: Score[]): Score[] {
  return scores.filter(s => s.state === 'graded' && s.numericValue !== null)
}

export function computeSubjectGrade(
  subjectId: string,
  label: string,
  scores: Score[],
  creditHours = 1,
): SubjectGradeResult {
  const graded = gradedOnly(scores)

  if (graded.length === 0) {
    return {
      subjectId,
      label,
      pointsAverage: null,
      masteryAverage: null,
      gradeLetter: null,
      creditHours,
      needsReview: false,
    }
  }

  const avg = graded.reduce((sum, s) => sum + s.numericValue!, 0) / graded.length
  const needsReview = decayStatus(scores)

  return {
    subjectId,
    label,
    pointsAverage: avg,
    masteryAverage: avg,
    gradeLetter: letterGrade(avg),
    creditHours,
    needsReview,
  }
}

export function masteryStatus(scores: Score[], strategy: MasteryStrategyType): MasteryStatus {
  const graded = gradedOnly(scores)

  if (graded.length === 0) {
    return { score: null, strategy, needsReview: false }
  }

  const sorted = [...graded].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))

  let score: number | null = null

  if (strategy === 'most_recent') {
    score = sorted[sorted.length - 1].numericValue!
  } else if (strategy === 'highest') {
    score = Math.max(...graded.map(s => s.numericValue!))
  } else {
    // decaying: use most-recent
    score = sorted[sorted.length - 1].numericValue!
  }

  const needsReview = strategy === 'decaying' ? decayStatus(scores) : false

  return { score, strategy, needsReview }
}

/**
 * Returns true when the most-recent graded score is lower than the previous best.
 * Surfaces "needs review" for decaying mastery.
 */
export function decayStatus(scores: Score[]): boolean {
  const graded = gradedOnly(scores)
  if (graded.length < 2) return false

  const sorted = [...graded].sort((a, b) => a.occurredAt.localeCompare(b.occurredAt))
  const latest = sorted[sorted.length - 1].numericValue!
  const prevBest = Math.max(...sorted.slice(0, -1).map(s => s.numericValue!))

  return latest < prevBest
}

/**
 * Computes weighted and unweighted GPA.
 * gradeMap: subjectId → numeric average (0–100). Missing entries = no grade (excluded, not zero).
 */
export function computeGpa(
  config: SubjectGradingConfig[],
  gradeMap: Map<string, number>,
): GpaResult {
  const gradedSubjects = config.filter(c => gradeMap.has(c.subjectId))

  if (gradedSubjects.length === 0) {
    return { weighted: null, unweighted: null, totalCreditHours: 0 }
  }

  const totalCredits = gradedSubjects.reduce((sum, c) => sum + (c.creditHours ?? 1), 0)

  const unweightedPoints = gradedSubjects.reduce((sum, c) => {
    const avg = gradeMap.get(c.subjectId)!
    return sum + gpaPoints(avg) * (c.creditHours ?? 1)
  }, 0)

  const unweighted = unweightedPoints / totalCredits

  // Weighted uses custom weight% if set, otherwise same as unweighted
  const hasWeights = gradedSubjects.some(c => c.weight !== undefined)
  let weighted: number

  if (hasWeights) {
    const totalWeight = gradedSubjects.reduce((sum, c) => sum + (c.weight ?? c.creditHours ?? 1), 0)
    const weightedPoints = gradedSubjects.reduce((sum, c) => {
      const avg = gradeMap.get(c.subjectId)!
      return sum + gpaPoints(avg) * (c.weight ?? c.creditHours ?? 1)
    }, 0)
    weighted = totalWeight > 0 ? weightedPoints / totalWeight : unweighted
  } else {
    weighted = unweighted
  }

  return {
    weighted,
    unweighted,
    totalCreditHours: totalCredits,
  }
}

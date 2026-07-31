export type ScoreState = 'graded' | 'not_graded' | 'missing' | 'excused' | 'complete'
export type ScoreSource = 'auto' | 'parent' | 'publisher' | 'outside' | 'ai'
export type MasteryStrategyType = 'most_recent' | 'decaying' | 'highest'
export type GradeBand = 'g1_4' | 'g5_8' | 'g9_12'

export interface Score {
  id: string
  subjectId: string
  learnerId: string
  householdId: string
  state: ScoreState
  /** 0–100 numeric value; null when state is not_graded/excused/missing */
  numericValue: number | null
  source: ScoreSource
  occurredAt: string
  comment?: string
  /** Set when this score was recorded against a specific scheduled lesson/assignment. */
  lessonTaskId?: string
}

export interface SubjectGradingConfig {
  subjectId: string
  label: string
  creditHours?: number
  masteryStrategy?: MasteryStrategyType
  /** Weighted percentage 0–100 for GPA (optional) */
  weight?: number
}

export interface SubjectGradeResult {
  subjectId: string
  label: string
  pointsAverage: number | null
  masteryAverage: number | null
  gradeLetter: string | null
  creditHours: number
  /** true when mastery is decaying / needs review */
  needsReview: boolean
  // ─── Course-config (Phase 6) — present so the gradebook UI can populate the panel ──
  isFormalCourse?: boolean
  termModel?: string | null
  gradingScaleId?: string | null
  aggregationRuleId?: string | null
}

export interface GpaResult {
  weighted: number | null
  unweighted: number | null
  totalCreditHours: number
}

export interface MasteryStatus {
  score: number | null
  strategy: MasteryStrategyType
  needsReview: boolean
}

// ─── Gradebook API types ───────────────────────────────────────────────────────

export interface GradebookSummary {
  learnerId: string
  learnerName: string
  gradeBand: GradeBand
  subjects: SubjectGradeResult[]
  gpa: GpaResult
  needsAttentionSubjects: string[]
  /**
   * Composer-safe "current grade": average of non-null subject `masteryAverage`
   * values, rounded to 1 decimal place. Null when the learner has no scored
   * subjects — never coerced to 0. Optional so existing literal fixtures that
   * predate this field remain valid.
   */
  overallMastery?: number | null
}

export interface NeedsAttentionItem {
  learnerId: string
  subjectId: string
  label: string
  reason: 'missing' | 'decaying' | 'no_scores'
}

// ─── Gradebook config (Phase 6) ─────────────────────────────────────────────────

export interface GradingScaleBand {
  /** Minimum percentage (0–100) for this band, inclusive. */
  minPercent: number
  letter: string
  gpaPoints: number
}

export interface GradingScale {
  id: string
  householdId: string
  name: string
  bands: GradingScaleBand[]
}

export type AggregationStrategy = 'average' | 'most_recent' | 'highest'

export interface AggregationRule {
  id: string
  householdId: string
  name: string
  strategy: AggregationStrategy
}

/** Course-config fields stored on a subject. */
export interface SubjectCourseConfig {
  creditHours: number | null
  isFormalCourse: boolean
  termModel: string | null
  gradingScaleId: string | null
  aggregationRuleId: string | null
}

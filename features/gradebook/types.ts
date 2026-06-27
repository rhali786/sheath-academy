export type ScoreState = 'graded' | 'not_graded' | 'missing' | 'excused' | 'complete'
export type ScoreSource = 'auto' | 'parent' | 'publisher' | 'outside' | 'ai'
export type MasteryStrategyType = 'most_recent' | 'decaying' | 'highest'
export type GradeBand = 'g1_4' | 'g5_8' | 'g9_12'

export interface Score {
  id: string
  attemptId: string
  subjectId: string
  learnerId: string
  householdId: string
  state: ScoreState
  /** 0–100 numeric value; null when state is not_graded/excused/missing */
  numericValue: number | null
  source: ScoreSource
  occurredAt: string
  comment?: string
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

// ─── Attempt ──────────────────────────────────────────────────────────────────

export interface Attempt {
  id: string
  learnerId: string
  subjectId: string | null
  householdId: string
  lessonTaskId?: string | null
  scores: Score[]
  occurredAt: string
}

// ─── Gradebook API types ───────────────────────────────────────────────────────

export interface GradebookSummary {
  learnerId: string
  learnerName: string
  gradeBand: GradeBand
  subjects: SubjectGradeResult[]
  gpa: GpaResult
  needsAttentionSubjects: string[]
}

export interface NeedsAttentionItem {
  subjectId: string
  label: string
  reason: 'missing' | 'decaying' | 'no_scores'
}

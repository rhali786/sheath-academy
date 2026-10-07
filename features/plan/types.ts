export type LessonTaskStatus = 'not_started' | 'completed' | 'skipped'

export type LessonDuration = '15min' | '30min' | '45min' | '1hr' | 'custom'

export type LessonStepType = 'instruction' | 'reading' | 'practice' | 'discussion' | 'assessment'

export interface LessonStep {
  id: string
  lessonTaskId: string
  order: number
  stepText: string
  type: string
  doneCriteria: string | null
  quantity: number | null
}

export interface LessonTask {
  id: string
  childId: string
  subjectId: string
  householdId: string
  title: string
  description?: string
  resourceLink?: string
  /** Completion window start; when omitted, dueDate alone defines the lesson day. */
  plannedStartDate?: string
  dueDate: string
  status: LessonTaskStatus
  order: number
  estimatedDuration?: LessonDuration
  /** Explicit HH:MM (24-hour) override for the schedule timeline; both set together or neither. */
  scheduledStartTime?: string
  scheduledEndTime?: string
  lessonType?: string
  completedAt?: string
  /** Shared link when one lesson was assigned to multiple learners (fan-out rows). */
  groupId?: string
  /** Curriculum/program name (e.g. "All About Reading Level 2"); muted sub-line under chapter on the card. */
  curriculum?: string
  /** Specific chapter/lesson focus (e.g. "Chapter 91"); becomes the card's focal line when set. */
  chapter?: string
  hasHomework?: boolean
  hasAssessment?: boolean
  createdAt: string
  updatedAt: string
}

// ─── Lesson shift (move not-started lessons along the school-day calendar) ────

export type ShiftMode = 'shift' | 'break'

export interface ShiftLessonsRequest {
  mode: ShiftMode
  /** 'shift' only: lessons due on or after this date move. 'break' uses the break's start. */
  fromDate?: string
  /** 'shift' only: how many school days later. */
  schoolDays?: number
  /** 'break' only: id of a break on the active school year whose dates lessons must leave. */
  breakId?: string
  /** Omit for all learners / all courses. */
  learnerIds?: string[]
  subjectIds?: string[]
}

export interface LessonDates {
  dueDate: string
  plannedStartDate: string | null
}

export interface LessonDateMove {
  id: string
  learnerId: string
  subjectId: string | null
  title: string
  from: LessonDates
  to: LessonDates
}

export interface ShiftPreview {
  moves: LessonDateMove[]
  countsByLearner: Record<string, number>
  /** How many moves land after the active school year's end date (still allowed). */
  pastYearEndCount: number
  schoolYearEnd: string | null
}

export interface ShiftApplyResult {
  applied: number
  /** Ids not moved because the lesson changed (dates or status) since the preview. */
  skipped: string[]
}

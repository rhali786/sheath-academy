export type ResourceType =
  | 'textbook'
  | 'workbook'
  | 'online-course'
  | 'quran-text'
  | 'reader'
  | 'other'

export type VerificationStatus =
  | 'user-submitted'
  | 'needs-review'
  | 'verified'
  | 'deprecated'

export type LessonGenerationStrategy =
  | 'byPage'
  | 'byChapter'
  | 'byLesson'
  | 'bySurah'
  | 'byModule'

export interface Resource {
  id: string
  workspaceId: string
  title: string
  publisher?: string
  author?: string
  edition?: string
  gradeLevel?: string
  subjectCategory?: string
  isbn?: string
  resourceType: ResourceType
  totalPages?: number
  totalLessons?: number
  totalChapters?: number
  verificationStatus: VerificationStatus
  createdAt: string
  updatedAt: string
}

export interface PacingTarget {
  strategy: 'finishByYearEnd' | 'finishByDate' | 'pagesPerWeek' | 'sessionsPerWeek'
  targetDate?: string
  pagesPerWeek?: number
  sessionsPerWeek?: number
}

export interface PaceInput {
  totalPages: number
  scheduledDays?: number
  completedPages?: number
  scheduledDaysRemaining?: number
}

export interface PaceResult {
  pagesPerDay?: number
  pagesPerDayNeeded?: number
  isOnTrack?: boolean
}

export interface GenerateLessonsInput {
  resource: Resource
  strategy: LessonGenerationStrategy
  /** Used for byChapter strategy — number of chapters in the resource */
  chapters?: number
  /** Total school days over which to distribute the generated lessons */
  schoolDays: number
  /** ISO date of the first school day (for calculating dueDates) */
  startDate?: string
}

export interface GeneratedLesson {
  title: string
  dueDate: string
  order: number
  description?: string
}

// ── Wave 14 — Community intelligence ─────────────────────────────────────────

export type CompatibilitySignal =
  | 'generally-compatible'
  | 'needsContext'
  | 'worldviewConcern'
  | 'sensitivContent'
  | 'stronglyBeneficial'
  | 'notReviewed'

export type FeedbackPrivacyLevel = 'anonymous' | 'named' | 'private' | 'shareForReview'

export type FeedbackStatus = 'pending_review' | 'verified' | 'rejected'

export interface ResourceFeedback {
  id: string
  resourceId: string
  parentId: string
  displayParentId?: string   // undefined when privacyLevel is 'anonymous'
  compatibility: CompatibilitySignal
  rating?: number            // 1–5
  difficulty?: string
  actualTimeMinutes?: number
  islamicNote?: string
  worksIndependently?: boolean
  worksTeacherLed?: boolean
  privacyLevel: FeedbackPrivacyLevel
  status: FeedbackStatus
  createdAt: string
}

export interface CommunityNote {
  id: string
  resourceId: string
  feedbackId: string        // source feedback
  difficulty?: string
  islamicNote?: string
  status: FeedbackStatus
  createdAt: string
  updatedAt: string
}

export type FeedbackSentiment = 'bad' | 'poor' | 'okay' | 'good' | 'great'

export type FeedbackStatus =
  | 'submitted'
  | 'classified'
  | 'awaiting_approval'
  | 'in_pr'
  | 'in_qa'
  | 'shipped'
  | 'cancelled'

export type FeedbackType =
  | 'bug'
  | 'enhancement'
  | 'ux'
  | 'copy'
  | 'performance'
  | 'question'

export type FeedbackRiskLevel = 'low' | 'medium' | 'high'

export type FeedbackConfidence = 'high' | 'medium' | 'low'

export interface FeedbackSubmitInput {
  pagePath: string
  sentiment: FeedbackSentiment
  message?: string
}

export interface FeedbackRow {
  id: string
  userId: string | null
  householdId: string | null
  householdName: string | null
  userEmail: string
  pagePath: string
  sentiment: FeedbackSentiment
  message: string | null
  createdAt: string

  status: FeedbackStatus
  featureArea: string | null
  feedbackType: FeedbackType | null
  riskLevel: FeedbackRiskLevel | null
  confidence: FeedbackConfidence | null
  recommendation?: string | null

  duplicateOfFeedbackId: string | null

  adminApprovedAt: string | null
  adminApprovedByUserId: string | null

  prNumber: number | null
  previewUrl: string | null
  uatInstructions: string | null

  versionResolved: string | null
  resolvedAt: string | null

  // Traceability backlink to changelog_entries (canonical changelog owner).
  // The joined display fields below are populated only by getFeedbackById.
  changelogEntryId: string | null
  changelogEntryLabel?: string | null
  changelogEntryUserCredit?: string | null
}

export interface FeedbackTriageUpdate {
  status?: FeedbackStatus
  featureArea?: string | null
  feedbackType?: FeedbackType | null
  riskLevel?: FeedbackRiskLevel | null
  confidence?: FeedbackConfidence | null
  recommendation?: string | null
  duplicateOfFeedbackId?: string | null
}

export interface FeedbackWorkflowUpdate {
  prNumber?: number | null
  previewUrl?: string | null
  uatInstructions?: string | null
  versionResolved?: string | null
  resolvedAt?: string | null
  changelogEntryId?: string | null
  status?: FeedbackStatus
}

export interface AdminFeedbackFilters {
  status?: FeedbackStatus
  confidence?: FeedbackConfidence
  riskLevel?: FeedbackRiskLevel
  feedbackType?: FeedbackType
  featureArea?: string
  prNumber?: number
  hasDuplicate?: boolean
}

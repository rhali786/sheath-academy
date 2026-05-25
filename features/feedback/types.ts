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

  duplicateOfFeedbackId: string | null

  adminApprovedAt: string | null
  adminApprovedByUserId: string | null

  prNumber: number | null
  previewUrl: string | null
  uatInstructions: string | null

  versionResolved: string | null
  resolvedAt: string | null

  changelogVersion: string | null
  changelogLabel: string | null
  changelogUserCredit: string | null
}

export interface FeedbackTriageUpdate {
  status?: FeedbackStatus
  featureArea?: string | null
  feedbackType?: FeedbackType | null
  riskLevel?: FeedbackRiskLevel | null
  confidence?: FeedbackConfidence | null
  duplicateOfFeedbackId?: string | null
}

export interface FeedbackWorkflowUpdate {
  prNumber?: number | null
  previewUrl?: string | null
  uatInstructions?: string | null
  versionResolved?: string | null
  resolvedAt?: string | null
  changelogVersion?: string | null
  changelogLabel?: string | null
  changelogUserCredit?: string | null
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

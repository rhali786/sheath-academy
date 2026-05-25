import {
  getFeedbackById,
  listFeedbackForAdmin,
  recordFeedbackApproval,
  updateFeedbackTriage,
} from '@/features/feedback/server/repository'
import type {
  FeedbackConfidence,
  FeedbackRiskLevel,
  FeedbackRow,
  FeedbackTriageUpdate,
  FeedbackType,
} from '@/features/feedback/types'

export interface ClassifyDecision {
  status: 'classified'
  featureArea: string
  feedbackType: FeedbackType
  riskLevel: FeedbackRiskLevel
  confidence: FeedbackConfidence
  recommendation: string
}

export interface DoNotAutomateConfig {
  featureAreas?: string[]
  feedbackTypes?: FeedbackType[]
}

export interface DailyRunEligibilityResult {
  feedbackIds: string[]
  autoEligibleIds: string[]
  approvedIds: string[]
  rows: FeedbackRow[]
}

export class FeedbackWorkflowError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly code: string,
  ) {
    super(message)
    this.name = 'FeedbackWorkflowError'
  }
}

function requiresApproval(decision: Pick<ClassifyDecision, 'confidence' | 'riskLevel'>): boolean {
  return !(decision.confidence === 'high' && decision.riskLevel === 'low')
}

function isBlockedByPolicy(row: Pick<FeedbackRow, 'featureArea' | 'feedbackType'>, config: DoNotAutomateConfig): boolean {
  const blockedFeatureAreas = new Set(config.featureAreas ?? [])
  const blockedFeedbackTypes = new Set(config.feedbackTypes ?? [])

  return (
    (row.featureArea !== null && blockedFeatureAreas.has(row.featureArea)) ||
    (row.feedbackType !== null && blockedFeedbackTypes.has(row.feedbackType))
  )
}

export async function approveFeedbackForPlanning(id: string, adminEmail: string): Promise<void> {
  const row = await getFeedbackById(id)

  if (!row) {
    throw new FeedbackWorkflowError('Feedback not found', 404, 'feedback_not_found')
  }

  if (row.status !== 'awaiting_approval') {
    throw new FeedbackWorkflowError(
      'Only feedback awaiting approval can be approved for planning',
      409,
      'invalid_feedback_state',
    )
  }

  await recordFeedbackApproval(id, adminEmail)
  await updateFeedbackTriage(id, { status: 'classified' })
}

export async function applyClassification(id: string, decision: ClassifyDecision): Promise<void> {
  const triage: FeedbackTriageUpdate = {
    status: requiresApproval(decision) ? 'awaiting_approval' : 'classified',
    featureArea: decision.featureArea,
    feedbackType: decision.feedbackType,
    riskLevel: decision.riskLevel,
    confidence: decision.confidence,
  }

  await updateFeedbackTriage(id, triage)
}

export async function markFeedbackDuplicate(id: string, duplicateOfId: string): Promise<void> {
  await updateFeedbackTriage(id, {
    status: 'cancelled',
    duplicateOfFeedbackId: duplicateOfId,
  })
}

export async function listEligibleFeedbackForDailyRun(
  config: DoNotAutomateConfig = {},
): Promise<DailyRunEligibilityResult> {
  const rows = await listFeedbackForAdmin({ status: 'classified' })

  const eligibleRows = rows.filter((row) => {
    if (row.status !== 'classified') return false
    if (row.prNumber !== null) return false
    if (row.confidence !== 'high') return false
    if (row.riskLevel !== 'low') return false
    if (isBlockedByPolicy(row, config)) return false
    return true
  })

  return {
    feedbackIds: eligibleRows.map((row) => row.id),
    autoEligibleIds: eligibleRows.filter((row) => !row.adminApprovedAt).map((row) => row.id),
    approvedIds: eligibleRows.filter((row) => !!row.adminApprovedAt).map((row) => row.id),
    rows: eligibleRows,
  }
}

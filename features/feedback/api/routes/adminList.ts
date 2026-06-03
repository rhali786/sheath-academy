import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import type { ApiResponse } from '@/features/lib/types'
import type { FeedbackRow, AdminFeedbackFilters, FeedbackStatus, FeedbackConfidence, FeedbackRiskLevel, FeedbackType } from '@/features/feedback/types'
import { listFeedbackForAdmin } from '@/features/feedback/server/repository'

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const url = new URL(request.url)
  const filters: AdminFeedbackFilters = {}

  const status = url.searchParams.get('status')
  if (status) filters.status = status as FeedbackStatus
  const confidence = url.searchParams.get('confidence')
  if (confidence) filters.confidence = confidence as FeedbackConfidence
  const riskLevel = url.searchParams.get('riskLevel')
  if (riskLevel) filters.riskLevel = riskLevel as FeedbackRiskLevel
  const feedbackType = url.searchParams.get('feedbackType')
  if (feedbackType) filters.feedbackType = feedbackType as FeedbackType
  const featureArea = url.searchParams.get('featureArea')
  if (featureArea) filters.featureArea = featureArea
  const prNumber = url.searchParams.get('prNumber')
  if (prNumber) filters.prNumber = parseInt(prNumber, 10)
  const hasDuplicate = url.searchParams.get('hasDuplicate')
  if (hasDuplicate === 'true') filters.hasDuplicate = true

  const rows = await listFeedbackForAdmin(filters)

  return NextResponse.json({
    status: 'success',
    data: rows,
    message: 'Feedback retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<FeedbackRow[]>)
}

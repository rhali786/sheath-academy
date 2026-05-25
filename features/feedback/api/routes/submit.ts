import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import type { ApiResponse } from '@/features/lib/types'
import { insertFeedback } from '@/features/feedback/server/repository'
import type { FeedbackSubmitInput, FeedbackSentiment } from '@/features/feedback/types'

const VALID_SENTIMENTS: FeedbackSentiment[] = ['bad', 'poor', 'okay', 'good', 'great']

export async function POST(request: Request): Promise<Response> {
  const { userId, householdId, email } = getRequestAuthCtx()

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Invalid JSON', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  const { pagePath, sentiment, message } = body as Partial<FeedbackSubmitInput>

  if (!pagePath || typeof pagePath !== 'string') {
    return NextResponse.json(
      { status: 'error', data: null, message: 'pagePath is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  if (!sentiment || !VALID_SENTIMENTS.includes(sentiment as FeedbackSentiment)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'sentiment must be one of: bad, poor, okay, good, great', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  await insertFeedback({
    id: crypto.randomUUID(),
    userId,
    householdId,
    userEmail: email ?? '',
    pagePath,
    sentiment: sentiment as FeedbackSentiment,
    message: message ?? undefined,
  })

  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'Feedback submitted',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<null>)
}

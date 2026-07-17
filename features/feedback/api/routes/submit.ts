import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import type { ApiResponse } from '@/features/lib/types'
import {
  insertFeedback,
  MAX_FEEDBACK_SCREENSHOT_BYTES,
  ALLOWED_FEEDBACK_SCREENSHOT_MIME_TYPES,
} from '@/features/feedback/server/repository'
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

  const { pagePath, sentiment, message, screenshot, screenshotMimeType } = body as Partial<FeedbackSubmitInput>

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

  let screenshotData: Buffer | undefined
  if (screenshot !== undefined) {
    if (typeof screenshot !== 'string' || !screenshotMimeType || typeof screenshotMimeType !== 'string') {
      return NextResponse.json(
        { status: 'error', data: null, message: 'screenshotMimeType is required when screenshot is provided', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }
    if (!ALLOWED_FEEDBACK_SCREENSHOT_MIME_TYPES.has(screenshotMimeType)) {
      return NextResponse.json(
        { status: 'error', data: null, message: 'screenshotMimeType must be one of: image/png, image/jpeg, image/webp, image/gif', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }
    try {
      screenshotData = Buffer.from(screenshot, 'base64')
    } catch {
      return NextResponse.json(
        { status: 'error', data: null, message: 'screenshot must be valid base64', timestamp: new Date().toISOString() },
        { status: 400 },
      )
    }
    if (screenshotData.length > MAX_FEEDBACK_SCREENSHOT_BYTES) {
      return NextResponse.json(
        {
          status: 'error',
          data: null,
          message: `Screenshot is too large — the limit is ${Math.floor(MAX_FEEDBACK_SCREENSHOT_BYTES / (1024 * 1024))}MB`,
          timestamp: new Date().toISOString(),
        },
        { status: 400 },
      )
    }
  }

  await insertFeedback({
    id: crypto.randomUUID(),
    userId,
    householdId,
    userEmail: email ?? '',
    pagePath,
    sentiment: sentiment as FeedbackSentiment,
    message: message ?? undefined,
    screenshotData: screenshotData ?? null,
    screenshotMimeType: screenshotData ? screenshotMimeType : undefined,
  })

  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'Feedback submitted',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<null>)
}

import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import type { ApiResponse } from '@/features/lib/types'
import type { FeedbackRow } from '@/features/feedback/types'
import { listFeedbackByUserId } from '@/features/feedback/server/repository'

export async function GET(request: Request): Promise<Response> {
  const { userId } = getRequestAuthCtx()
  if (!userId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    )
  }

  const rows = await listFeedbackByUserId(userId)

  return NextResponse.json({
    status: 'success',
    data: rows,
    message: 'Feedback retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<FeedbackRow[]>)
}

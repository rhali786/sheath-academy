import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { isAppAdmin } from '@/features/lib/server/appAdmin'
import type { ApiResponse } from '@/features/lib/types'
import type { FeedbackRow } from '@/features/feedback/types'
import { listFeedbackByUserId, listFeedbackForAdmin } from '@/features/feedback/server/repository'

export async function GET(request: Request): Promise<Response> {
  const { userId, email } = getRequestAuthCtx()
  if (!userId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    )
  }

  const rows = isAppAdmin(email)
    ? await listFeedbackForAdmin()
    : await listFeedbackByUserId(userId)

  return NextResponse.json({
    status: 'success',
    data: rows,
    message: 'Feedback retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<FeedbackRow[]>)
}

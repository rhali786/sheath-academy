import { NextResponse } from 'next/server'
import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import type { ApiResponse } from '@/features/lib/types'
import type { FeedbackRow } from '@/features/feedback/types'
import { getFeedbackById } from '@/features/feedback/server/repository'
import { isAppAdmin } from '@/features/lib/server/appAdmin'

export async function GET(request: Request, id: string): Promise<Response> {
  const { userId, email } = getRequestAuthCtx()
  if (!userId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Unauthorized', timestamp: new Date().toISOString() },
      { status: 401 },
    )
  }

  const row = await getFeedbackById(id)

  if (!row) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Not found', timestamp: new Date().toISOString() },
      { status: 404 },
    )
  }

  const isAdmin = email ? isAppAdmin(email) : false
  if (row.userId !== userId && !isAdmin) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Forbidden', timestamp: new Date().toISOString() },
      { status: 403 },
    )
  }

  return NextResponse.json({
    status: 'success',
    data: row,
    message: 'Feedback retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<FeedbackRow>)
}

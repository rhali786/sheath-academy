import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import type { ApiResponse } from '@/features/lib/types'
import type { FeedbackRow } from '@/features/feedback/types'
import { listFeedback } from '@/features/feedback/server/repository'

export async function GET(request: Request): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  const rows = await listFeedback()

  return NextResponse.json({
    status: 'success',
    data: rows,
    message: 'Feedback retrieved',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<FeedbackRow[]>)
}

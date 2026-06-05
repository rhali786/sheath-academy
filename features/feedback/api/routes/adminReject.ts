import { NextResponse } from 'next/server'
import { requireAdminApi } from '@/features/lib/server/requireAdminApi'
import type { ApiResponse } from '@/features/lib/types'
import { rejectForPlanning, FeedbackWorkflowError } from '@/features/feedback/server/service'

export async function POST(request: Request, id: string): Promise<Response> {
  const gate = await requireAdminApi(request)
  if (!gate.ok) return gate.response

  if (!id) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Feedback ID required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    await rejectForPlanning(id)
  } catch (error) {
    if (error instanceof FeedbackWorkflowError) {
      return NextResponse.json(
        { status: 'error', data: null, message: error.message, timestamp: new Date().toISOString() },
        { status: error.statusCode },
      )
    }

    throw error
  }

  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'Feedback rejected',
    timestamp: new Date().toISOString(),
  } satisfies ApiResponse<null>)
}

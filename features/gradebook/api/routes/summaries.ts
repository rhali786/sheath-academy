import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { GradebookSummary } from '@/features/gradebook/types'
import { listGradebookSummaries } from '@/features/gradebook/server/repository'

export async function GET(
  _request: Request,
): Promise<NextResponse<ApiResponse<GradebookSummary[]>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const summaries = await listGradebookSummaries(householdId)
    return NextResponse.json({
      status: 'success',
      data: summaries,
      message: 'Gradebook summaries retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      {
        status: 'error',
        data: [],
        message: 'Failed to retrieve gradebook summaries',
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}

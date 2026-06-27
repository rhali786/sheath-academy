import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { Score } from '@/features/gradebook/types'
import { listScores } from '@/features/gradebook/server/repository'

export async function GET(
  request: Request,
): Promise<NextResponse<ApiResponse<Score[]>>> {
  const url = new URL(request.url)
  const learnerId = url.searchParams.get('learnerId')
  const subjectId = url.searchParams.get('subjectId')

  if (!learnerId) {
    return NextResponse.json(
      { status: 'error', data: [], message: 'learnerId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }
  if (!subjectId) {
    return NextResponse.json(
      { status: 'error', data: [], message: 'subjectId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const scores = await listScores(householdId, learnerId, subjectId)
    return NextResponse.json({
      status: 'success',
      data: scores,
      message: 'Scores retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: [], message: 'Failed to retrieve scores', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

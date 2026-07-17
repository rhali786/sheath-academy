import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { Score, ScoreState } from '@/features/gradebook/types'
import { listScores, createScore, rowToScore } from '@/features/gradebook/server/repository'
import { guardOwnership, assertSessionOwnership } from '@/features/auth/server/routeOwnership'

const VALID_STATES: ScoreState[] = ['graded', 'not_graded', 'missing', 'excused', 'complete']

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

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<Score | null>>> {
  const body = await request.json()
  const { learnerId, subjectId, state, numericValue, occurredAt, comment, lessonTaskId } = body

  if (!learnerId) {
    return NextResponse.json({ status: 'error', data: null, message: 'learnerId is required', timestamp: new Date().toISOString() }, { status: 400 })
  }
  if (!subjectId) {
    return NextResponse.json({ status: 'error', data: null, message: 'subjectId is required', timestamp: new Date().toISOString() }, { status: 400 })
  }
  if (!state || !VALID_STATES.includes(state)) {
    return NextResponse.json({ status: 'error', data: null, message: 'A valid state is required', timestamp: new Date().toISOString() }, { status: 400 })
  }
  if (state === 'graded' && typeof numericValue !== 'number') {
    return NextResponse.json({ status: 'error', data: null, message: 'numericValue is required for graded scores', timestamp: new Date().toISOString() }, { status: 400 })
  }

  return guardOwnership(async () => {
    await assertSessionOwnership('learner', learnerId)
    const { householdId } = getRequestAuthCtx()
    const row = await createScore(householdId, {
      learnerId,
      subjectId,
      lessonTaskId: lessonTaskId ?? undefined,
      state,
      numericValue: state === 'graded' ? numericValue : null,
      source: 'parent',
      occurredAt: occurredAt ?? new Date().toISOString(),
      comment: comment ?? undefined,
    })
    return NextResponse.json(
      { status: 'success', data: rowToScore(row), message: 'Score saved', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  }) as Promise<NextResponse<ApiResponse<Score | null>>>
}

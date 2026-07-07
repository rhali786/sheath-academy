import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { Score, ScoreState } from '@/features/gradebook/types'
import { updateScore, deleteScore, rowToScore } from '@/features/gradebook/server/repository'

const VALID_STATES: ScoreState[] = ['graded', 'not_graded', 'missing', 'excused', 'complete']

export async function PATCH(
  id: string,
  request: Request,
): Promise<NextResponse<ApiResponse<Score | null>>> {
  const body = await request.json()
  const { state, numericValue, occurredAt, comment } = body

  if (state !== undefined && !VALID_STATES.includes(state)) {
    return NextResponse.json({ status: 'error', data: null, message: 'Invalid state value', timestamp: new Date().toISOString() }, { status: 400 })
  }
  if (state === 'graded' && typeof numericValue !== 'number') {
    return NextResponse.json({ status: 'error', data: null, message: 'numericValue is required for graded scores', timestamp: new Date().toISOString() }, { status: 400 })
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateScore(id, householdId, {
      state,
      // When state is non-graded, clear the numeric value; otherwise pass through if provided.
      numericValue: state !== undefined && state !== 'graded' ? null : numericValue,
      occurredAt,
      comment,
    })
    if (!updated) {
      return NextResponse.json({ status: 'error', data: null, message: 'Score not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: rowToScore(updated), message: 'Score updated', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Score not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await deleteScore(id, householdId)
    if (!removed) {
      return NextResponse.json({ status: 'error', data: null, message: 'Score not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: null, message: 'Score deleted', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Score not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

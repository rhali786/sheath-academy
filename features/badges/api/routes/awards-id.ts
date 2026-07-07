import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeAward } from '@/features/badges/types'
import { updateAwardStatus, deleteAward } from '@/features/badges/server/repository'

/**
 * The award lifecycle the UI drives: draft → submitted → verified → approved.
 * 'approved' is not a stored status value — it is the approvedAt timestamp on a
 * verified award (isEarned). Each transition stamps the matching timestamp.
 */
type AwardTransition = 'submitted' | 'verified' | 'approved'
const VALID_TRANSITIONS: AwardTransition[] = ['submitted', 'verified', 'approved']

export async function PATCH(
  id: string,
  request: Request,
): Promise<NextResponse<ApiResponse<BadgeAward | null>>> {
  const body = await request.json()
  const transition = body.status as AwardTransition

  if (!transition || !VALID_TRANSITIONS.includes(transition)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'A valid status transition is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  const now = new Date()
  try {
    const { householdId } = getRequestAuthCtx()
    let updated: BadgeAward | null
    if (transition === 'submitted') {
      updated = await updateAwardStatus(id, householdId, 'submitted', { submittedAt: now })
    } else if (transition === 'verified') {
      updated = await updateAwardStatus(id, householdId, 'verified', { verifiedAt: now })
    } else {
      // approved: keep the terminal 'verified' status, stamp approvedAt (earned)
      updated = await updateAwardStatus(id, householdId, 'verified', { approvedAt: now })
    }
    if (!updated) {
      return NextResponse.json({ status: 'error', data: null, message: 'Award not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: updated, message: 'Award updated', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Award not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await deleteAward(id, householdId)
    if (!removed) {
      return NextResponse.json({ status: 'error', data: null, message: 'Award not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: null, message: 'Award revoked', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Award not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeAwardEvidence } from '@/features/badges/types'
import { addEvidenceToAward, removeEvidenceFromAward } from '@/features/badges/server/repository'

export async function POST(
  awardId: string,
  request: Request,
): Promise<NextResponse<ApiResponse<BadgeAwardEvidence | null>>> {
  const body = await request.json()
  const { evidenceId } = body

  if (!evidenceId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'evidenceId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const link = await addEvidenceToAward(householdId, { badgeAwardId: awardId, evidenceId })
    return NextResponse.json(
      { status: 'success', data: link, message: 'Evidence linked', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to link evidence', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

export async function DELETE(
  _awardId: string,
  evidenceLinkId: string,
): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await removeEvidenceFromAward(evidenceLinkId, householdId)
    if (!removed) {
      return NextResponse.json({ status: 'error', data: null, message: 'Evidence link not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: null, message: 'Evidence unlinked', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Evidence link not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

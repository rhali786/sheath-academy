import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeAward } from '@/features/badges/types'
import { listBadgeAwards, createAward } from '@/features/badges/server/repository'
import { guardOwnership, assertSessionOwnership } from '@/features/auth/server/routeOwnership'

export async function GET(
  request: Request,
): Promise<NextResponse<ApiResponse<BadgeAward[]>>> {
  const url = new URL(request.url)
  const learnerId = url.searchParams.get('learnerId')

  if (!learnerId) {
    return NextResponse.json(
      { status: 'error', data: [], message: 'learnerId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const awards = await listBadgeAwards(householdId, learnerId)
    return NextResponse.json({
      status: 'success',
      data: awards,
      message: 'Badge awards retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: [], message: 'Failed to retrieve badge awards', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<BadgeAward | null>>> {
  const body = await request.json()
  const { learnerId, badgeId } = body

  if (!learnerId || !badgeId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'learnerId and badgeId are required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  return guardOwnership(async () => {
    await assertSessionOwnership('learner', learnerId)
    const { householdId } = getRequestAuthCtx()
    const award = await createAward(householdId, { learnerId, badgeId, status: 'draft' })
    return NextResponse.json(
      { status: 'success', data: award, message: 'Award created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  }) as Promise<NextResponse<ApiResponse<BadgeAward | null>>>
}

import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeAward } from '@/features/badges/types'
import { listBadgeAwards } from '@/features/badges/server/repository'

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

import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeDefinition } from '@/features/badges/types'
import { listBadgeDefinitions } from '@/features/badges/server/repository'

export async function GET(
  _request: Request,
): Promise<NextResponse<ApiResponse<BadgeDefinition[]>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const definitions = await listBadgeDefinitions(householdId)
    return NextResponse.json({
      status: 'success',
      data: definitions,
      message: 'Badge definitions retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: [], message: 'Failed to retrieve badge definitions', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

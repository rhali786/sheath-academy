import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { BadgeSettings } from '@/features/badges/types'
import { getBadgeSettings, setBadgeSettings } from '@/features/badges/server/repository'

export async function GET(
  _request: Request,
): Promise<NextResponse<ApiResponse<BadgeSettings>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const settings = await getBadgeSettings(householdId)
    return NextResponse.json({
      status: 'success',
      data: settings,
      message: 'Badge settings retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: { householdId: '', platformBadgesEnabled: true }, message: 'Failed to retrieve badge settings', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: Request,
): Promise<NextResponse<ApiResponse<BadgeSettings | null>>> {
  const body = await request.json()
  const { platformBadgesEnabled } = body

  if (typeof platformBadgesEnabled !== 'boolean') {
    return NextResponse.json(
      { status: 'error', data: null, message: 'platformBadgesEnabled (boolean) is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    await setBadgeSettings(householdId, { platformBadgesEnabled })
    return NextResponse.json({
      status: 'success',
      data: { householdId, platformBadgesEnabled },
      message: 'Badge settings updated',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to update badge settings', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

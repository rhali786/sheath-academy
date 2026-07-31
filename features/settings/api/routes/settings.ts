import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import { getAllHouseholdSettings, setHouseholdSetting } from '@/features/settings/server/repository'

export async function GET(
  _request: Request,
): Promise<NextResponse<ApiResponse<Record<string, unknown>>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const settings = await getAllHouseholdSettings(householdId)
    return NextResponse.json({
      status: 'success',
      data: settings,
      message: 'Settings retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: {}, message: 'Failed to retrieve settings', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

export async function PUT(
  request: Request,
): Promise<NextResponse<ApiResponse<Record<string, unknown> | null>>> {
  const body = await request.json()

  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'A settings key/value object is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const entries = Object.entries(body as Record<string, unknown>)
    for (const [key, value] of entries) {
      await setHouseholdSetting(householdId, key, value)
    }
    const settings = await getAllHouseholdSettings(householdId)
    return NextResponse.json({
      status: 'success',
      data: settings,
      message: 'Settings updated',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to update settings', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

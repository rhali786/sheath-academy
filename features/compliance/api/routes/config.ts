import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import { setHouseholdComplianceConfig } from '@/features/compliance/server/repository'

export async function PUT(
  request: Request,
): Promise<NextResponse<ApiResponse<null>>> {
  const body = await request.json()
  const { activeRulesetId, pathwayKey } = body

  try {
    const { householdId } = getRequestAuthCtx()
    await setHouseholdComplianceConfig(householdId, {
      activeRulesetId: activeRulesetId ?? null,
      pathwayKey: pathwayKey ?? null,
    })
    return NextResponse.json({
      status: 'success',
      data: null,
      message: 'Compliance config updated',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to update compliance config', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

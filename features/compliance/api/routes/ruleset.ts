import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ComplianceRuleset } from '@/features/compliance/types'
import { getActiveRuleset } from '@/features/compliance/server/repository'

export async function GET(
  _request: Request,
): Promise<NextResponse<ApiResponse<ComplianceRuleset | null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const ruleset = await getActiveRuleset(householdId)
    return NextResponse.json({
      status: 'success',
      data: ruleset,
      message: 'Ruleset retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to retrieve ruleset', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

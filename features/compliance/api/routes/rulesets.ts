import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ComplianceRuleset } from '@/features/compliance/types'
import { listRulesets } from '@/features/compliance/server/repository'

export async function GET(
  _request: Request,
): Promise<NextResponse<ApiResponse<ComplianceRuleset[]>>> {
  try {
    const rulesets = await listRulesets()
    return NextResponse.json({
      status: 'success',
      data: rulesets,
      message: 'Rulesets retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: [], message: 'Failed to retrieve rulesets', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

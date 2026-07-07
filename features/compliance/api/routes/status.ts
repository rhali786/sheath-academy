import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { StatusEngineResult } from '@/features/compliance/types'
import { getComplianceStatusInput } from '@/features/compliance/server/repository'
import { runStatusEngine } from '@/features/compliance/server/status-engine'

export async function GET(
  request: Request,
): Promise<NextResponse<ApiResponse<StatusEngineResult | null>>> {
  const url = new URL(request.url)
  const schoolYearId = url.searchParams.get('schoolYearId')

  if (!schoolYearId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'schoolYearId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const input = await getComplianceStatusInput(householdId, schoolYearId)
    const result = runStatusEngine(input)
    return NextResponse.json({
      status: 'success',
      data: result,
      message: 'Informational only — not legal advice',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to compute compliance status', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

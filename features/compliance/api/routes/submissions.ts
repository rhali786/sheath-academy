import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ComplianceSubmission } from '@/features/compliance/types'
import { listSubmissions } from '@/features/compliance/server/repository'

export async function GET(
  request: Request,
): Promise<NextResponse<ApiResponse<ComplianceSubmission[]>>> {
  const url = new URL(request.url)
  const schoolYearId = url.searchParams.get('schoolYearId')

  if (!schoolYearId) {
    return NextResponse.json(
      { status: 'error', data: [], message: 'schoolYearId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const submissions = await listSubmissions(householdId, schoolYearId)
    return NextResponse.json({
      status: 'success',
      data: submissions,
      message: 'Submissions retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: [], message: 'Failed to retrieve submissions', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

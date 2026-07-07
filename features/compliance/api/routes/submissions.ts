import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ComplianceSubmission, SubmissionStatus } from '@/features/compliance/types'
import { listSubmissions, createSubmission } from '@/features/compliance/server/repository'

const VALID_SUBMISSION_STATUSES: SubmissionStatus[] = ['drafted', 'sent', 'accepted']

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

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<ComplianceSubmission | null>>> {
  const body = await request.json()
  const { schoolYearId, status } = body

  if (!schoolYearId) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'schoolYearId is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }
  if (status !== undefined && !VALID_SUBMISSION_STATUSES.includes(status)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Invalid submission status', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const submission = await createSubmission(householdId, { schoolYearId, status })
    return NextResponse.json(
      { status: 'success', data: submission, message: 'Submission created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to create submission', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ComplianceSubmission, SubmissionStatus } from '@/features/compliance/types'
import { updateSubmissionStatus, deleteSubmission } from '@/features/compliance/server/repository'

const VALID_SUBMISSION_STATUSES: SubmissionStatus[] = ['drafted', 'sent', 'accepted']

export async function PATCH(
  id: string,
  request: Request,
): Promise<NextResponse<ApiResponse<ComplianceSubmission | null>>> {
  const body = await request.json()
  const { status } = body

  if (!status || !VALID_SUBMISSION_STATUSES.includes(status)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'A valid status is required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  // Stamp the appropriate timestamp as the submission advances.
  const now = new Date()
  const extra: { submittedAt?: Date | null; acceptedAt?: Date | null } = {}
  if (status === 'sent') extra.submittedAt = now
  if (status === 'accepted') extra.acceptedAt = now

  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateSubmissionStatus(id, householdId, status, extra)
    if (!updated) {
      return NextResponse.json({ status: 'error', data: null, message: 'Submission not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: updated, message: 'Submission updated', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Submission not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await deleteSubmission(id, householdId)
    if (!removed) {
      return NextResponse.json({ status: 'error', data: null, message: 'Submission not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: null, message: 'Submission deleted', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Submission not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

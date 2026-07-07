import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ComplianceDeadline } from '@/features/compliance/types'
import { listDeadlines, createDeadline } from '@/features/compliance/server/repository'

export async function GET(
  request: Request,
): Promise<NextResponse<ApiResponse<ComplianceDeadline[]>>> {
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
    const deadlines = await listDeadlines(householdId, schoolYearId)
    return NextResponse.json({
      status: 'success',
      data: deadlines,
      message: 'Deadlines retrieved',
      timestamp: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { status: 'error', data: [], message: 'Failed to retrieve deadlines', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

export async function POST(
  request: Request,
): Promise<NextResponse<ApiResponse<ComplianceDeadline | null>>> {
  const body = await request.json()
  const { schoolYearId, label, dueDate, requirementType } = body

  if (!schoolYearId || !label || !dueDate || !requirementType) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'schoolYearId, label, dueDate, and requirementType are required', timestamp: new Date().toISOString() },
      { status: 400 },
    )
  }

  try {
    const { householdId } = getRequestAuthCtx()
    const deadline = await createDeadline(householdId, { schoolYearId, label, dueDate, requirementType })
    return NextResponse.json(
      { status: 'success', data: deadline, message: 'Deadline created', timestamp: new Date().toISOString() },
      { status: 201 },
    )
  } catch {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Failed to create deadline', timestamp: new Date().toISOString() },
      { status: 500 },
    )
  }
}

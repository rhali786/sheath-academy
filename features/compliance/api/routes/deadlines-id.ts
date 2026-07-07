import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { ComplianceDeadline } from '@/features/compliance/types'
import { updateDeadline, deleteDeadline } from '@/features/compliance/server/repository'

export async function PATCH(
  id: string,
  request: Request,
): Promise<NextResponse<ApiResponse<ComplianceDeadline | null>>> {
  const body = await request.json()
  const { label, dueDate, requirementType, isCompleted } = body

  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateDeadline(id, householdId, { label, dueDate, requirementType, isCompleted })
    if (!updated) {
      return NextResponse.json({ status: 'error', data: null, message: 'Deadline not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: updated, message: 'Deadline updated', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Deadline not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const removed = await deleteDeadline(id, householdId)
    if (!removed) {
      return NextResponse.json({ status: 'error', data: null, message: 'Deadline not found', timestamp: new Date().toISOString() }, { status: 404 })
    }
    return NextResponse.json({ status: 'success', data: null, message: 'Deadline deleted', timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ status: 'error', data: null, message: 'Deadline not found', timestamp: new Date().toISOString() }, { status: 404 })
  }
}

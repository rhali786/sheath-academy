import { getRequestAuthCtx } from '@/features/auth/server/requestAuth'
import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AttendanceRecord } from '@/features/attendance/types'
import { getAttendanceEvent, updateAttendanceEvent, voidAttendanceEvent } from '@/features/attendance/server/repository'
import type { AttendanceEventRow } from '@/features/attendance/server/repository'

function rowToRecord(r: AttendanceEventRow): AttendanceRecord {
  return {
    id: r.id,
    childId: r.learnerId,
    householdId: r.householdId,
    date: r.attendanceDate,
    status: r.status as AttendanceRecord['status'],
    minutes: r.minutes ?? undefined,
    notes: r.notes ?? undefined,
    isArchived: r.voidedAt !== null,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: r.updatedAt?.toISOString() ?? new Date().toISOString(),
  }
}

export async function GET(id: string): Promise<NextResponse<ApiResponse<AttendanceRecord | null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const row = await getAttendanceEvent(id, householdId)
    if (!row) return NextResponse.json({ status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToRecord(row), message: 'Attendance record retrieved', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function PATCH(id: string, request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord | null>>> {
  const body = await request.json()
  try {
    const { householdId } = getRequestAuthCtx()
    const updated = await updateAttendanceEvent(id, householdId, { status: body.status, minutes: body.minutes, notes: body.notes })
    if (!updated) return NextResponse.json({ status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: rowToRecord(updated), message: 'Attendance record updated', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

export async function DELETE(id: string): Promise<NextResponse<ApiResponse<null>>> {
  try {
    const { householdId } = getRequestAuthCtx()
    const voided = await voidAttendanceEvent(id, householdId)
    if (!voided) return NextResponse.json({ status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() }, { status: 404 })
    return NextResponse.json({ status: 'success', data: null, message: 'Attendance record voided', timestamp: new Date().toISOString() })
  } catch { return NextResponse.json({ status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() }, { status: 404 }) }
}

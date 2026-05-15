import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AttendanceRecord } from '@/features/attendance/types'
import { getRecord, updateRecord, deleteRecord } from '@/features/attendance/server/service'

export function GET(id: string): NextResponse<ApiResponse<AttendanceRecord | null>> {
  const record = getRecord(id)
  if (!record) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: record,
    message: 'Attendance record retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function PATCH(id: string, request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord | null>>> {
  const body = await request.json()
  const updated = updateRecord(id, body)
  if (!updated) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: updated,
    message: 'Attendance record updated',
    timestamp: new Date().toISOString(),
  })
}

export function DELETE(id: string): NextResponse<ApiResponse<null>> {
  const removed = deleteRecord(id)
  if (!removed) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Record not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }
  return NextResponse.json({
    status: 'success',
    data: null,
    message: 'Attendance record deleted',
    timestamp: new Date().toISOString(),
  })
}

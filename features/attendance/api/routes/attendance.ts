import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AttendanceRecord } from '@/features/attendance/types'
import { getRecords, createRecord, isValidStatus } from '@/features/attendance/server/service'

export async function GET(request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const date = url.searchParams.get('date') ?? undefined
  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined

  const records = getRecords({ childId, date, startDate, endDate })

  return NextResponse.json({
    status: 'success',
    data: records,
    message: 'Attendance records retrieved',
    timestamp: new Date().toISOString(),
  })
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord | null>>> {
  const body = await request.json()
  const { childId, householdId, date, status, notes, hours, minutes } = body

  if (!childId || !date || !status) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'childId, date, and status are required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  if (!isValidStatus(status)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'status must be present, absent, or partial', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  const record = createRecord({ childId, householdId: householdId ?? '', date, status, notes, hours, minutes })

  if (!record) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Child not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { status: 'success', data: record, message: 'Attendance record created', timestamp: new Date().toISOString() },
    { status: 201 }
  )
}

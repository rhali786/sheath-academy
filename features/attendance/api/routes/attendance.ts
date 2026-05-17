import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AttendanceRecord } from '@/features/attendance/types'
import { getRecords, createOrUpdateRecord, isValidStatus } from '@/features/attendance/server/service'

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
  const { childId, householdId, date, status, attendanceType, reason, notes, hours, minutes } = body

  if (!childId || !date || !status) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'childId, date, and status are required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  if (!isValidStatus(status)) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Invalid status value', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  const record = createOrUpdateRecord({
    childId,
    householdId: householdId ?? '',
    date,
    status,
    attendanceType: attendanceType ?? undefined,
    reason: reason ?? undefined,
    notes: notes ?? undefined,
    hours: hours ?? undefined,
    minutes: minutes ?? undefined,
  })

  if (!record) {
    return NextResponse.json(
      { status: 'error', data: null, message: 'Child not found', timestamp: new Date().toISOString() },
      { status: 404 }
    )
  }

  return NextResponse.json(
    { status: 'success', data: record, message: 'Attendance record saved', timestamp: new Date().toISOString() },
    { status: 201 }
  )
}

export async function BATCH(request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord[]>>> {
  const body = await request.json()
  const { householdId, date, entries } = body

  if (!date || !Array.isArray(entries)) {
    return NextResponse.json(
      { status: 'error', data: [], message: 'date and entries[] are required', timestamp: new Date().toISOString() },
      { status: 400 }
    )
  }

  const results: AttendanceRecord[] = []
  for (const entry of entries) {
    if (!entry.childId || !isValidStatus(entry.status)) continue
    const record = createOrUpdateRecord({
      childId: entry.childId,
      householdId: householdId ?? '',
      date,
      status: entry.status,
    })
    if (record) results.push(record)
  }

  return NextResponse.json(
    { status: 'success', data: results, message: 'Batch attendance saved', timestamp: new Date().toISOString() },
    { status: 201 }
  )
}

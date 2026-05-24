import { NextResponse } from 'next/server'
import type { AttendanceRecord } from '@/features/attendance/types'
import { createRecord, isValidStatus } from '@/features/attendance/server/service'

function errorResponse(message: string, statusCode: number) {
  return NextResponse.json(
    { status: 'error' as const, data: [] as AttendanceRecord[], message, timestamp: new Date().toISOString() },
    { status: statusCode }
  )
}

export async function POST(request: Request) {
  const body = await request.json()
  const { householdId, date, status, childIds, hours, minutes, notes } = body

  if (!Array.isArray(childIds) || childIds.length === 0) {
    return errorResponse('childIds must be a non-empty array', 400)
  }

  if (!date) {
    return errorResponse('date is required', 400)
  }

  if (!isValidStatus(status)) {
    return errorResponse('status must be present, absent, or partial', 400)
  }

  const created: AttendanceRecord[] = []

  for (const childId of childIds) {
    const record = createRecord({
      childId,
      householdId: householdId ?? '',
      date,
      status,
      notes: notes || undefined,
      hours: hours !== undefined ? Number(hours) : undefined,
      minutes: minutes !== undefined ? Number(minutes) : undefined,
    })
    if (record) {
      created.push(record)
    }
  }

  return NextResponse.json(
    { status: 'success', data: created, message: `${created.length} attendance record(s) created`, timestamp: new Date().toISOString() },
    { status: 201 }
  )
}

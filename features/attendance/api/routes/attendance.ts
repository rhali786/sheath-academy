import { NextResponse } from 'next/server'
import type { ApiResponse } from '@/features/lib/types'
import type { AttendanceRecord } from '@/features/attendance/types'
import { getRecords, createOrUpdateRecord, isValidStatus } from '@/features/attendance/server/service'
import { listAttendanceEvents, createAttendanceEvent } from '@/features/attendance/server/repository'
import type { AttendanceEventRow } from '@/features/attendance/server/repository'
import { isPostgresMode } from '@/features/lib/server/db'
import { getHouseholdContext } from '@/features/lib/server/tenant'

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

export async function GET(request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord[]>>> {
  const url = new URL(request.url)
  const childId = url.searchParams.get('childId') ?? undefined
  const date = url.searchParams.get('date') ?? undefined
  const startDate = url.searchParams.get('startDate') ?? undefined
  const endDate = url.searchParams.get('endDate') ?? undefined

  if (isPostgresMode()) {
    try {
      const { householdId } = await getHouseholdContext()
      const rows = await listAttendanceEvents(householdId, { learnerId: childId, date, startDate, endDate })
      return NextResponse.json({ status: 'success', data: rows.map(rowToRecord), message: 'Attendance records retrieved', timestamp: new Date().toISOString() })
    } catch {
      return NextResponse.json({ status: 'success', data: [], message: 'Attendance records retrieved', timestamp: new Date().toISOString() })
    }
  }

  const records = getRecords({ childId, date, startDate, endDate })
  return NextResponse.json({ status: 'success', data: records, message: 'Attendance records retrieved', timestamp: new Date().toISOString() })
}

export async function POST(request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord | null>>> {
  const body = await request.json()
  const { childId, householdId, date, status, attendanceType, reason, notes, hours, minutes } = body

  if (!childId || !date || !status) {
    return NextResponse.json({ status: 'error', data: null, message: 'childId, date, and status are required', timestamp: new Date().toISOString() }, { status: 400 })
  }
  if (!isValidStatus(status)) {
    return NextResponse.json({ status: 'error', data: null, message: 'Invalid status value', timestamp: new Date().toISOString() }, { status: 400 })
  }

  if (isPostgresMode()) {
    try {
      const ctx = await getHouseholdContext()
      const row = await createAttendanceEvent(ctx.householdId, { learnerId: childId, attendanceDate: date, status, minutes: minutes ?? undefined, notes: notes ?? undefined })
      return NextResponse.json({ status: 'success', data: rowToRecord(row), message: 'Attendance record saved', timestamp: new Date().toISOString() }, { status: 201 })
    } catch (e) {
      return NextResponse.json({ status: 'error', data: null, message: 'Failed to save attendance record', timestamp: new Date().toISOString() }, { status: 500 })
    }
  }

  const record = createOrUpdateRecord({ childId, householdId: householdId ?? '', date, status, attendanceType: attendanceType ?? undefined, reason: reason ?? undefined, notes: notes ?? undefined, hours: hours ?? undefined, minutes: minutes ?? undefined })
  if (!record) return NextResponse.json({ status: 'error', data: null, message: 'Child not found', timestamp: new Date().toISOString() }, { status: 404 })
  return NextResponse.json({ status: 'success', data: record, message: 'Attendance record saved', timestamp: new Date().toISOString() }, { status: 201 })
}

export async function BATCH(request: Request): Promise<NextResponse<ApiResponse<AttendanceRecord[]>>> {
  const body = await request.json()
  const { householdId, date, entries } = body

  if (!date || !Array.isArray(entries)) {
    return NextResponse.json({ status: 'error', data: [], message: 'date and entries[] are required', timestamp: new Date().toISOString() }, { status: 400 })
  }

  if (isPostgresMode()) {
    try {
      const ctx = await getHouseholdContext()
      const results: AttendanceRecord[] = []
      for (const entry of entries) {
        if (!entry.childId || !isValidStatus(entry.status)) continue
        const row = await createAttendanceEvent(ctx.householdId, { learnerId: entry.childId, attendanceDate: date, status: entry.status })
        results.push(rowToRecord(row))
      }
      return NextResponse.json({ status: 'success', data: results, message: 'Batch attendance saved', timestamp: new Date().toISOString() }, { status: 201 })
    } catch (e) {
      return NextResponse.json({ status: 'error', data: [], message: 'Failed to save batch attendance', timestamp: new Date().toISOString() }, { status: 500 })
    }
  }

  const results: AttendanceRecord[] = []
  for (const entry of entries) {
    if (!entry.childId || !isValidStatus(entry.status)) continue
    const record = createOrUpdateRecord({ childId: entry.childId, householdId: householdId ?? '', date, status: entry.status })
    if (record) results.push(record)
  }
  return NextResponse.json({ status: 'success', data: results, message: 'Batch attendance saved', timestamp: new Date().toISOString() }, { status: 201 })
}

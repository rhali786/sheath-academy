// Memory store removed. Functions below are stubs kept for compilation.
// Callers (alerts, records, setup features) are pending Postgres migration.
import type { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../types'
import { and, gte, isNull, lte, sql } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { attendanceEvents } from '@/db/schema'

export interface AdminAttendanceCount {
  householdId: string
  count: number
  lastDate: string | null
}

/** Cross-household aggregate for admin metrics. Uses attendance_events_date_household_idx. */
export async function getAdminAttendanceCounts(
  periodStart: string,
  periodEnd: string,
): Promise<AdminAttendanceCount[]> {
  const db = getDb()
  const rows = await db
    .select({
      householdId: attendanceEvents.householdId,
      count: sql<number>`count(*)::int`,
      lastDate: sql<string | null>`max(${attendanceEvents.attendanceDate})`,
    })
    .from(attendanceEvents)
    .where(
      and(
        gte(attendanceEvents.attendanceDate, periodStart),
        lte(attendanceEvents.attendanceDate, periodEnd),
        isNull(attendanceEvents.voidedAt),
      ),
    )
    .groupBy(attendanceEvents.householdId)
  return rows
}

export const ALL_STATUSES: AttendanceStatus[] = [
  'present', 'absent', 'partial', 'excused', 'sick', 'holiday', 'field_trip', 'coop', 'makeup', 'not_school',
]

export function isValidStatus(s: unknown): s is AttendanceStatus {
  return ALL_STATUSES.includes(s as AttendanceStatus)
}

export function getRecords(_filters?: Record<string, unknown>): AttendanceRecord[] { return [] }
export function getRecord(_id: string): AttendanceRecord | undefined { return undefined }
export function createRecord(_data: unknown): AttendanceRecord | null { return null }
export function createOrUpdateRecord(_data: unknown): AttendanceRecord | null { return null }
export function updateRecord(_id: string, _patch: unknown): AttendanceRecord | null { return null }
export function archiveRecord(_id: string): boolean { return false }
export function deleteRecord(_id: string): boolean { return false }
export function getAttendanceSummary(_childId: string, _start?: string, _end?: string): AttendanceSummary {
  return { childId: _childId, totalPresent: 0, totalAbsent: 0, totalPartial: 0, totalRecorded: 0 }
}
export function archiveByChildId(_childId: string): void {}
export function resetStore(_seed?: AttendanceRecord[]): void {}

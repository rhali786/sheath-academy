import type { AttendanceRecord, AttendanceSummary, AttendanceStatus } from '../types'
import { ATTENDANCE_STATUSES, isAttendanceStatus } from '../types'
import { listAttendanceEvents } from './repository'
import { summarizeAttendanceByStatus } from './summarize'
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

export const ALL_STATUSES: AttendanceStatus[] = ATTENDANCE_STATUSES

export function isValidStatus(s: unknown): s is AttendanceStatus {
  return typeof s === 'string' && isAttendanceStatus(s)
}

export async function getAttendanceSummary(
  householdId: string,
  childId: string,
  start?: string,
  end?: string,
): Promise<AttendanceSummary> {
  const rows = await listAttendanceEvents(householdId, {
    learnerId: childId,
    startDate: start,
    endDate: end,
  })
  return summarizeAttendanceByStatus(
    childId,
    rows.map(row => row.status),
  )
}

// Legacy stubs — callers (alerts, setup) pending Postgres migration.
export function getRecords(_filters?: Record<string, unknown>): AttendanceRecord[] { return [] }
export function getRecord(_id: string): AttendanceRecord | undefined { return undefined }
export function createRecord(_data: unknown): AttendanceRecord | null { return null }
export function createOrUpdateRecord(_data: unknown): AttendanceRecord | null { return null }
export function updateRecord(_id: string, _patch: unknown): AttendanceRecord | null { return null }
export function archiveRecord(_id: string): boolean { return false }
export function deleteRecord(_id: string): boolean { return false }
export function archiveByChildId(_childId: string): void {}
export function resetStore(_seed?: AttendanceRecord[]): void {}

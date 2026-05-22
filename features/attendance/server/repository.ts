import { and, eq, gte, isNull, lte, not } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { attendanceEvents } from '@/db/schema'

export type AttendanceEventRow = typeof attendanceEvents.$inferSelect

export interface CreateAttendanceEventInput {
  learnerId: string
  attendanceDate: string
  status: string
  minutes?: number
  notes?: string
}

export interface AttendanceEventFilters {
  learnerId?: string
  date?: string
  startDate?: string
  endDate?: string
  includeVoided?: boolean
}

export async function listAttendanceEvents(
  householdId: string,
  filters: AttendanceEventFilters = {},
): Promise<AttendanceEventRow[]> {
  const db = getDb()
  const conditions = [eq(attendanceEvents.householdId, householdId)]
  if (!filters.includeVoided) conditions.push(isNull(attendanceEvents.voidedAt))
  if (filters.learnerId) conditions.push(eq(attendanceEvents.learnerId, filters.learnerId))
  if (filters.date) conditions.push(eq(attendanceEvents.attendanceDate, filters.date))
  if (filters.startDate) conditions.push(gte(attendanceEvents.attendanceDate, filters.startDate))
  if (filters.endDate) conditions.push(lte(attendanceEvents.attendanceDate, filters.endDate))
  return db.select().from(attendanceEvents).where(and(...conditions))
}

export async function getAttendanceEvent(
  id: string,
  householdId: string,
): Promise<AttendanceEventRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(attendanceEvents)
    .where(and(eq(attendanceEvents.id, id), eq(attendanceEvents.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

export async function createAttendanceEvent(
  householdId: string,
  input: CreateAttendanceEventInput,
): Promise<AttendanceEventRow> {
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(attendanceEvents)
    .values({
      id: `att_${Date.now()}`,
      householdId,
      learnerId: input.learnerId,
      attendanceDate: input.attendanceDate,
      status: input.status,
      minutes: input.minutes ?? null,
      notes: input.notes ?? null,
      occurredAt: now,
      voidedAt: null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function updateAttendanceEvent(
  id: string,
  householdId: string,
  patch: Partial<Pick<AttendanceEventRow, 'status' | 'minutes' | 'notes'>>,
): Promise<AttendanceEventRow | null> {
  const db = getDb()
  const result = await db
    .update(attendanceEvents)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(attendanceEvents.id, id), eq(attendanceEvents.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function voidAttendanceEvent(
  id: string,
  householdId: string,
): Promise<AttendanceEventRow | null> {
  const db = getDb()
  const result = await db
    .update(attendanceEvents)
    .set({ voidedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(attendanceEvents.id, id), eq(attendanceEvents.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

/** Returns true if a learner has at least one non-voided attendance event on a given date. */
export async function hasAttendanceToday(
  householdId: string,
  learnerId: string,
  date: string,
): Promise<boolean> {
  const events = await listAttendanceEvents(householdId, { learnerId, date, includeVoided: false })
  return events.length > 0
}

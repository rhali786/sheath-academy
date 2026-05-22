import { and, eq, gte, lte } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { quranSessions } from '@/db/schema'

export type QuranSessionRow = typeof quranSessions.$inferSelect

export interface CreateQuranSessionInput {
  learnerId: string
  sessionDate: string
  sessionType: string
  surah?: string
  fromAyah?: number
  toAyah?: number
  durationMinutes?: number
  notes?: string
}

export interface QuranSessionFilters {
  learnerId?: string
  startDate?: string
  endDate?: string
  sessionType?: string
}

export async function listQuranSessionRows(
  householdId: string,
  filters: QuranSessionFilters = {},
): Promise<QuranSessionRow[]> {
  const db = getDb()
  const conditions = [eq(quranSessions.householdId, householdId)]
  if (filters.learnerId) conditions.push(eq(quranSessions.learnerId, filters.learnerId))
  if (filters.sessionType) conditions.push(eq(quranSessions.sessionType, filters.sessionType))
  if (filters.startDate) conditions.push(gte(quranSessions.sessionDate, filters.startDate))
  if (filters.endDate) conditions.push(lte(quranSessions.sessionDate, filters.endDate))
  return db.select().from(quranSessions).where(and(...conditions))
}

export async function getQuranSessionRow(
  id: string,
  householdId: string,
): Promise<QuranSessionRow | null> {
  const db = getDb()
  const result = await db
    .select()
    .from(quranSessions)
    .where(and(eq(quranSessions.id, id), eq(quranSessions.householdId, householdId)))
    .limit(1)
  return result[0] ?? null
}

/** Finds session by id or creates with that id. Idempotent for seeds. */
export async function upsertQuranSessionRow(
  householdId: string,
  sessionId: string,
  input: CreateQuranSessionInput,
): Promise<QuranSessionRow> {
  const existing = await getQuranSessionRow(sessionId, householdId)
  if (existing) return existing
  const db = getDb()
  const now = new Date()
  const inserted = await db
    .insert(quranSessions)
    .values({
      id: sessionId,
      householdId,
      learnerId: input.learnerId,
      sessionDate: input.sessionDate,
      sessionType: input.sessionType,
      surah: input.surah ?? null,
      fromAyah: input.fromAyah ?? null,
      toAyah: input.toAyah ?? null,
      durationMinutes: input.durationMinutes ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function createQuranSessionRow(
  householdId: string,
  input: CreateQuranSessionInput,
): Promise<QuranSessionRow> {
  const db = getDb()

  const now = new Date()
  const inserted = await db
    .insert(quranSessions)
    .values({
      id: `quran_${Date.now()}`,
      householdId,
      learnerId: input.learnerId,
      sessionDate: input.sessionDate,
      sessionType: input.sessionType,
      surah: input.surah ?? null,
      fromAyah: input.fromAyah ?? null,
      toAyah: input.toAyah ?? null,
      durationMinutes: input.durationMinutes ?? null,
      notes: input.notes ?? null,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
  return inserted[0]
}

export async function updateQuranSessionRow(
  id: string,
  householdId: string,
  patch: Partial<CreateQuranSessionInput>,
): Promise<QuranSessionRow | null> {
  const db = getDb()
  const update: Partial<QuranSessionRow> = { updatedAt: new Date() }
  if (patch.sessionDate !== undefined) update.sessionDate = patch.sessionDate
  if (patch.sessionType !== undefined) update.sessionType = patch.sessionType
  if (patch.surah !== undefined) update.surah = patch.surah
  if (patch.fromAyah !== undefined) update.fromAyah = patch.fromAyah
  if (patch.toAyah !== undefined) update.toAyah = patch.toAyah
  if (patch.durationMinutes !== undefined) update.durationMinutes = patch.durationMinutes
  if (patch.notes !== undefined) update.notes = patch.notes

  const result = await db
    .update(quranSessions)
    .set(update)
    .where(and(eq(quranSessions.id, id), eq(quranSessions.householdId, householdId)))
    .returning()
  return result[0] ?? null
}

export async function deleteQuranSessionRow(
  id: string,
  householdId: string,
): Promise<boolean> {
  const db = getDb()
  const result = await db
    .delete(quranSessions)
    .where(and(eq(quranSessions.id, id), eq(quranSessions.householdId, householdId)))
    .returning()
  return result.length > 0
}

/** Calculates consecutive-day streak from DB sessions for a given learner. */
export async function calcQuranStreak(
  householdId: string,
  learnerId: string,
): Promise<number> {
  const rows = await listQuranSessionRows(householdId, { learnerId })
  const dates = new Set(rows.map(r => r.sessionDate))
  const today = new Date()
  let streak = 0
  const cursor = new Date(today)
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  while (dates.has(fmt(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

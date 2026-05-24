import type { QuranSession } from '@/features/lib/types'
import { and, gte, lte, sql } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { quranSessions } from '@/db/schema'
import { listQuranSessionRows } from './repository'

export interface AdminQuranCount {
  householdId: string
  count: number
  lastDate: string | null
}

/** Cross-household aggregate for admin metrics. Uses quran_sessions_date_household_idx. */
export async function getAdminQuranCounts(
  periodStart: string,
  periodEnd: string,
): Promise<AdminQuranCount[]> {
  const db = getDb()
  const rows = await db
    .select({
      householdId: quranSessions.householdId,
      count: sql<number>`count(*)::int`,
      lastDate: sql<string | null>`max(${quranSessions.sessionDate})`,
    })
    .from(quranSessions)
    .where(and(gte(quranSessions.sessionDate, periodStart), lte(quranSessions.sessionDate, periodEnd)))
    .groupBy(quranSessions.householdId)
  return rows
}

export interface QuranSummary {
  childId?: string
  sessionsLogged: number
  sessionsByType: Array<{ type: string; count: number }>
  recentSessions: QuranSession[]
  dateRange: { startDate?: string; endDate?: string }
  streakDays: number
}

function rowToSession(r: Awaited<ReturnType<typeof listQuranSessionRows>>[number]): QuranSession {
  return {
    id: r.id, childId: r.learnerId, type: r.sessionType,
    surah: r.surah ?? '', fromAyah: r.fromAyah ?? 0, toAyah: r.toAyah ?? 0,
    notes: r.notes ?? '', date: r.sessionDate, lastLogged: r.sessionDate,
  }
}

function calcStreak(sessions: QuranSession[]): number {
  const sessionDates = new Set(sessions.map(s => s.date))
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  let streak = 0
  const cursor = new Date()
  while (sessionDates.has(fmt(cursor))) {
    streak++
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export async function getQuranSummary(
  householdId: string,
  { childId, startDate, endDate }: { childId?: string; startDate?: string; endDate?: string } = {},
): Promise<QuranSummary> {
  const rows = await listQuranSessionRows(householdId, { learnerId: childId, startDate, endDate })
  const sessions = rows.map(rowToSession)

  const byType: Record<string, number> = {}
  for (const r of rows) {
    byType[r.sessionType] = (byType[r.sessionType] || 0) + 1
  }

  return {
    childId,
    sessionsLogged: rows.length,
    sessionsByType: Object.entries(byType).map(([type, count]) => ({ type, count })),
    recentSessions: sessions.slice(0, 5),
    dateRange: { startDate, endDate },
    streakDays: calcStreak(sessions),
  }
}

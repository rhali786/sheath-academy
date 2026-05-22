import { isPostgresMode } from '@/features/lib/server/db'
import type {
  AdminMetricsQuery,
  AdminMetricsSummary,
  AdminMetricsUsersResult,
  UsageEvent,
} from '@/features/admin-metrics/types'
import {
  buildUserRow,
  computeSummaryFromEvents,
  defaultPeriodRange,
  filterAndSortUserRows,
  paginateRows,
  type HouseholdSnapshot,
} from './metrics'
import { listUsageEvents } from './repository'
import { getMemoryUsageEvents } from './store'

async function listAllHouseholdSnapshots(): Promise<HouseholdSnapshot[]> {
  if (isPostgresMode()) {
    const { getDb } = await import('@/features/lib/server/db')
    const { households, users, learners } = await import('@/db/schema')
    const { eq } = await import('drizzle-orm')
    const db = getDb()
    const joined = await db
      .select({
        householdId: households.id,
        householdName: households.name,
        userId: households.userId,
        userEmail: users.email,
        userName: users.name,
      })
      .from(households)
      .innerJoin(users, eq(households.userId, users.id))

    const snapshots: HouseholdSnapshot[] = []
    for (const row of joined) {
      const learnerRows = await db
        .select({ id: learners.id })
        .from(learners)
        .where(eq(learners.householdId, row.householdId))
      snapshots.push({
        householdId: row.householdId,
        householdName: row.householdName,
        userId: row.userId,
        userEmail: row.userEmail ?? undefined,
        userName: row.userName ?? undefined,
        learnerCount: learnerRows.length,
      })
    }
    return snapshots
  }

  const { getHouseholdProfile } = await import('@/features/household/server/service')
  const { getStudentProfiles } = await import('@/features/children/server/service')
  const profile = getHouseholdProfile()
  if (!profile) return []
  const learners = getStudentProfiles(profile.id)
  return [
    {
      householdId: profile.id,
      householdName: profile.familyName,
      userId: 'memory-user',
      userEmail: 'memory@test.local',
      learnerCount: learners.length,
    },
  ]
}

async function fetchEvents(periodStart: string, periodEnd: string): Promise<UsageEvent[]> {
  const start = new Date(`${periodStart}T00:00:00Z`)
  const end = new Date(`${periodEnd}T23:59:59Z`)
  if (isPostgresMode()) {
    return listUsageEvents({ periodStart: start, periodEnd: end })
  }
  return getMemoryUsageEvents().filter(e => {
    const d = e.occurredAt.slice(0, 10)
    return d >= periodStart && d <= periodEnd
  })
}

export async function getAdminMetricsSummary(
  periodStart?: string,
  periodEnd?: string,
): Promise<AdminMetricsSummary> {
  const defaults = defaultPeriodRange()
  const start = periodStart ?? defaults.periodStart
  const end = periodEnd ?? defaults.periodEnd
  const spanMs =
    new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()
  const prevEnd = new Date(new Date(`${start}T00:00:00Z`).getTime() - 86400000)
  const prevStart = new Date(prevEnd.getTime() - spanMs)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  const [events, previousEvents] = await Promise.all([
    fetchEvents(start, end),
    fetchEvents(fmt(prevStart), fmt(prevEnd)),
  ])

  return computeSummaryFromEvents(events, previousEvents, start, end)
}

export async function getAdminMetricsUsers(query: AdminMetricsQuery): Promise<AdminMetricsUsersResult> {
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 50
  const snapshots = await listAllHouseholdSnapshots()
  const [periodEvents, allEvents] = await Promise.all([
    fetchEvents(query.periodStart, query.periodEnd),
    fetchEvents('2000-01-01', '2099-12-31'),
  ])

  const byHousehold = new Map<string, UsageEvent[]>()
  const allByHousehold = new Map<string, UsageEvent[]>()
  for (const e of periodEvents) {
    const list = byHousehold.get(e.householdId) ?? []
    list.push(e)
    byHousehold.set(e.householdId, list)
  }
  for (const e of allEvents) {
    const list = allByHousehold.get(e.householdId) ?? []
    list.push(e)
    allByHousehold.set(e.householdId, list)
  }

  const rows = snapshots.map(s =>
    buildUserRow(
      s,
      byHousehold.get(s.householdId) ?? [],
      allByHousehold.get(s.householdId) ?? [],
      query.periodStart,
      query.periodEnd,
    ),
  )

  const filtered = filterAndSortUserRows(rows, query)
  const { rows: pageRows, total } = paginateRows(filtered, page, pageSize)

  return { rows: pageRows, total, page, pageSize }
}

export async function listAdminUsageEvents(
  periodStart: string,
  periodEnd: string,
  limit = 100,
): Promise<UsageEvent[]> {
  const events = await fetchEvents(periodStart, periodEnd)
  return events
    .sort((a, b) => b.occurredAt.localeCompare(a.occurredAt))
    .slice(0, limit)
}

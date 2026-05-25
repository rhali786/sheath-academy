import { eq } from 'drizzle-orm'
import { getDb } from '@/features/lib/server/db'
import { households, users } from '@/db/schema'
import { listLearners, getAdminLearnerCounts } from '@/features/children/server/repository'
import { getAdminLessonCounts } from '@/features/plan/server/service'
import { getAdminAttendanceCounts } from '@/features/attendance/server/service'
import { getAdminQuranCounts } from '@/features/quran/server/service'
import { getAdminEvidenceCounts } from '@/features/portfolio/server/service'
import { defaultPeriodRange, filterAndSortUserRows, paginateRows } from './metrics'
import type {
  AdminMetricsQuery,
  AdminMetricsSummary,
  AdminMetricsUsersResult,
  AdminMetricsUserRow,
} from '@/features/admin-metrics/types'

function latestDate(...dates: (string | null)[]): string | undefined {
  const valid = dates.filter(Boolean) as string[]
  if (!valid.length) return undefined
  return valid.sort().at(-1)
}

export async function getAdminMetricsUsers(query: AdminMetricsQuery): Promise<AdminMetricsUsersResult> {
  const { periodStart, periodEnd } = query
  const page = query.page ?? 1
  const pageSize = query.pageSize ?? 50

  const db = getDb()

  // 1. All households with their user info
  const hhRows = await db
    .select({
      householdId: households.id,
      householdName: households.name,
      userId: households.userId,
      userEmail: users.email,
      userName: users.name,
    })
    .from(households)
    .innerJoin(users, eq(households.userId, users.id))

  // 2. Domain aggregates in parallel
  const [lessonCounts, attendanceCounts, quranCounts, evidenceCounts, learnerCounts] = await Promise.all([
    getAdminLessonCounts(periodStart, periodEnd),
    getAdminAttendanceCounts(periodStart, periodEnd),
    getAdminQuranCounts(periodStart, periodEnd),
    getAdminEvidenceCounts(periodStart, periodEnd),
    getAdminLearnerCounts(periodStart, periodEnd),
  ])

  // Index by householdId for O(1) lookup
  const lessonMap = new Map(lessonCounts.map(r => [r.householdId, r]))
  const attMap = new Map(attendanceCounts.map(r => [r.householdId, r]))
  const quranMap = new Map(quranCounts.map(r => [r.householdId, r]))
  const evidenceMap = new Map(evidenceCounts.map(r => [r.householdId, r]))
  const learnerCreatedMap = new Map(learnerCounts.map(r => [r.householdId, r]))

  // 3. Learner info per household
  const learnersByHousehold = new Map<string, { count: number; names: string[] }>()
  await Promise.all(
    hhRows.map(async hh => {
      const learners = await listLearners(hh.householdId)
      learnersByHousehold.set(hh.householdId, {
        count: learners.length,
        names: learners.map(l => l.name),
      })
    }),
  )

  // 4. Build one row per household
  const rows: AdminMetricsUserRow[] = hhRows.map(hh => {
    const lessons = lessonMap.get(hh.householdId)
    const att = attMap.get(hh.householdId)
    const quran = quranMap.get(hh.householdId)
    const evidence = evidenceMap.get(hh.householdId)
    const learnerCreated = learnerCreatedMap.get(hh.householdId)
    const learners = learnersByHousehold.get(hh.householdId) ?? { count: 0, names: [] }

    const lessonCount = lessons?.count ?? 0
    const completedCount = lessons?.completedCount ?? 0
    const attCount = att?.count ?? 0
    const quranCount = quran?.count ?? 0
    const evidenceCount = evidence?.count ?? 0
    const learnerCreatedCount = learnerCreated?.count ?? 0

    const isActiveInPeriod = lessonCount > 0 || attCount > 0 || quranCount > 0 || evidenceCount > 0 || learnerCreatedCount > 0
    const lastActiveAt = latestDate(lessons?.lastDueDate ?? null, att?.lastDate ?? null, quran?.lastDate ?? null, evidence?.lastDate ?? null, learnerCreated?.lastDate ?? null)

    // Drop-off signal: learners exist but zero activity
    const dropOffSignals: import('@/features/admin-metrics/types').DropOffSignal[] =
      learners.count > 0 && !isActiveInPeriod ? ['learners_no_activity'] : []

    return {
      userId: hh.userId,
      userName: hh.userName ?? undefined,
      userEmail: hh.userEmail ?? undefined,
      workspaceId: hh.householdId,
      workspaceName: hh.householdName,
      workspaceType: 'family' as const,
      isActiveInPeriod,
      lastActiveAt,
      learnerCount: learners.count,
      learnerNames: learners.names,
      lessonTasksInPeriod: lessonCount,
      lessonsCompletedInPeriod: completedCount,
      attendanceEventsInPeriod: attCount,
      // Map domain counts to event-model fields for UI compatibility
      sessionsLogged: lessonCount + quranCount,
      completionEvents: completedCount,
      startedNotCompletedCount: Math.max(0, lessonCount - completedCount),
      quranRecordsCreated: quranCount,
      arabicRecordsCreated: 0,
      islamicStudiesRecordsCreated: 0,
      deenRecordsCreated: quranCount,
      evidenceItemsCreated: evidenceCount,
      reportsGenerated: 0,
      featureUsageByArea: {},
      dropOffSignals,
    }
  })

  const filtered = filterAndSortUserRows(rows, query)
  const { rows: pageRows, total } = paginateRows(filtered, page, pageSize)
  return { rows: pageRows, total, page, pageSize }
}

export async function getAdminMetricsSummary(
  periodStart?: string,
  periodEnd?: string,
): Promise<AdminMetricsSummary> {
  const defaults = defaultPeriodRange()
  const start = periodStart ?? defaults.periodStart
  const end = periodEnd ?? defaults.periodEnd

  const { rows } = await getAdminMetricsUsers({
    periodStart: start,
    periodEnd: end,
    page: 1,
    pageSize: 10000,
  })

  const activeHouseholds = rows.filter(r => r.isActiveInPeriod)

  return {
    periodStart: start,
    periodEnd: end,
    activeUsers: activeHouseholds.length,
    activeFamilies: activeHouseholds.length,
    learnersCreated: rows.reduce((s, r) => s + r.learnerCount, 0),
    sessionsLogged: rows.reduce((s, r) => s + r.sessionsLogged, 0),
    completionEvents: rows.reduce((s, r) => s + r.completionEvents, 0),
    attendanceEventsLogged: rows.reduce((s, r) => s + r.attendanceEventsInPeriod, 0),
    deenRecordsCreated: rows.reduce((s, r) => s + r.deenRecordsCreated, 0),
    evidenceItemsCreated: rows.reduce((s, r) => s + r.evidenceItemsCreated, 0),
    reportsGenerated: 0,
    previousPeriodComparison: { activeUsersDelta: 0, sessionsDelta: 0, evidenceReportsDelta: 0 },
  }
}

export async function listAdminUsageEvents(
  _periodStart: string,
  _periodEnd: string,
  _limit?: number,
) {
  return []
}

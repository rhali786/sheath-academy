import type {
  AdminMetricsSummary,
  AdminMetricsUserRow,
  AdminMetricsQuery,
  DropOffSignal,
  FeatureArea,
  UsageEvent,
  UsageEventType,
} from '@/features/admin-metrics/types'

export interface HouseholdSnapshot {
  householdId: string
  householdName: string
  userId: string
  userEmail?: string
  userName?: string
  learnerCount: number
  learnerNames: string[]
  lessonTasksInPeriod: number
  lessonsCompletedInPeriod: number
}

const SESSION_START_TYPES: UsageEventType[] = ['session_started']
const SESSION_LOG_TYPES: UsageEventType[] = [
  'session_started',
  'session_completed',
  'lesson_completed',
  'session_abandoned',
]
const COMPLETION_TYPES: UsageEventType[] = ['session_completed', 'lesson_completed']
const LEARNING_TYPES: UsageEventType[] = [
  ...SESSION_LOG_TYPES,
  'quran_record_created',
  'arabic_record_created',
  'islamic_studies_record_created',
]
const DEEN_TYPES: UsageEventType[] = [
  'quran_record_created',
  'arabic_record_created',
  'islamic_studies_record_created',
]

function inPeriod(iso: string, start: string, end: string): boolean {
  const d = iso.slice(0, 10)
  return d >= start && d <= end
}

function countByType(events: UsageEvent[], types: UsageEventType[]): number {
  return events.filter(e => types.includes(e.eventType)).length
}

function featureCounts(events: UsageEvent[]): Partial<Record<FeatureArea, number>> {
  const out: Partial<Record<FeatureArea, number>> = {}
  for (const e of events) {
    out[e.featureArea] = (out[e.featureArea] ?? 0) + 1
  }
  return out
}

export function computeDropOffSignals(
  householdEvents: UsageEvent[],
  allTimeEvents: UsageEvent[],
  snapshot: HouseholdSnapshot,
  periodEnd: string,
): DropOffSignal[] {
  const signals: DropOffSignal[] = []
  const periodLearning = householdEvents.filter(e => LEARNING_TYPES.includes(e.eventType))
  const periodEvidence = householdEvents.filter(e => e.eventType === 'evidence_created').length
  const periodReports = householdEvents.filter(e => e.eventType === 'report_generated').length
  const starts = householdEvents.filter(e => SESSION_START_TYPES.includes(e.eventType)).length
  const completions = countByType(householdEvents, COMPLETION_TYPES)

  const hasLearner = snapshot.learnerCount > 0
  const everLearner = allTimeEvents.some(e => e.eventType === 'learner_created') || hasLearner

  if (everLearner && periodLearning.length === 0) {
    signals.push('learners_no_activity')
  }
  if (starts > completions && starts > 0) {
    signals.push('started_not_completed')
  }
  if (periodLearning.length > 0 && periodEvidence === 0) {
    signals.push('activity_no_evidence')
  }
  if ((periodLearning.length > 0 || periodEvidence > 0) && periodReports === 0) {
    signals.push('records_no_report')
  }

  const lastActive = householdEvents
    .map(e => e.occurredAt)
    .sort()
    .at(-1)
  if (lastActive) {
    const end = new Date(`${periodEnd}T23:59:59Z`)
    const last = new Date(lastActive)
    const days = (end.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
    if (days >= 30) signals.push('inactive_30_days')
  } else if (everLearner) {
    signals.push('inactive_30_days')
  }

  return signals
}

export function buildUserRow(
  snapshot: HouseholdSnapshot,
  periodEvents: UsageEvent[],
  allEvents: UsageEvent[],
  periodStart: string,
  periodEnd: string,
): AdminMetricsUserRow {
  const activeTypes: UsageEventType[] = [
    'user_active',
    ...LEARNING_TYPES,
    'learner_created',
    'evidence_created',
    'report_generated',
    'family_created',
  ]
  const activeInPeriod = periodEvents.some(e => activeTypes.includes(e.eventType))
  const lastActiveAt = periodEvents.map(e => e.occurredAt).sort().at(-1)

  const sessionsLogged = countByType(periodEvents, SESSION_LOG_TYPES)
  const completionEvents = countByType(periodEvents, COMPLETION_TYPES)
  const starts = countByType(periodEvents, SESSION_START_TYPES)
  const startedNotCompletedCount = Math.max(0, starts - completionEvents)

  return {
    userId: snapshot.userId,
    userName: snapshot.userName,
    userEmail: snapshot.userEmail,
    workspaceId: snapshot.householdId,
    workspaceName: snapshot.householdName,
    workspaceType: 'family',
    isActiveInPeriod: activeInPeriod,
    lastActiveAt,
    learnerCount: Math.max(
      snapshot.learnerCount,
      periodEvents.filter(e => e.eventType === 'learner_created').length,
    ),
    learnerNames: snapshot.learnerNames,
    lessonTasksInPeriod: snapshot.lessonTasksInPeriod,
    lessonsCompletedInPeriod: snapshot.lessonsCompletedInPeriod,
    sessionsLogged,
    completionEvents,
    startedNotCompletedCount,
    quranRecordsCreated: periodEvents.filter(e => e.eventType === 'quran_record_created').length,
    arabicRecordsCreated: periodEvents.filter(e => e.eventType === 'arabic_record_created').length,
    islamicStudiesRecordsCreated: periodEvents.filter(
      e => e.eventType === 'islamic_studies_record_created',
    ).length,
    deenRecordsCreated: countByType(periodEvents, DEEN_TYPES),
    evidenceItemsCreated: periodEvents.filter(e => e.eventType === 'evidence_created').length,
    reportsGenerated: periodEvents.filter(e => e.eventType === 'report_generated').length,
    attendanceEventsInPeriod: 0,
    featureUsageByArea: featureCounts(periodEvents),
    dropOffSignals: computeDropOffSignals(periodEvents, allEvents, snapshot, periodEnd),
  }
}

export function computeSummaryFromEvents(
  events: UsageEvent[],
  previousEvents: UsageEvent[],
  periodStart: string,
  periodEnd: string,
): AdminMetricsSummary {
  const activeUserIds = new Set(
    events
      .filter(e =>
        ['user_active', ...LEARNING_TYPES, 'learner_created', 'evidence_created', 'report_generated'].includes(
          e.eventType,
        ),
      )
      .map(e => e.userId),
  )
  const activeHouseholdIds = new Set(
    events
      .filter(e =>
        ['user_active', ...LEARNING_TYPES, 'learner_created', 'evidence_created', 'report_generated'].includes(
          e.eventType,
        ),
      )
      .map(e => e.householdId),
  )

  const prevActiveUsers = new Set(previousEvents.map(e => e.userId)).size
  const prevSessions = countByType(previousEvents, SESSION_LOG_TYPES)
  const prevEvidenceReports =
    previousEvents.filter(e => e.eventType === 'evidence_created').length +
    previousEvents.filter(e => e.eventType === 'report_generated').length
  const curEvidenceReports =
    events.filter(e => e.eventType === 'evidence_created').length +
    events.filter(e => e.eventType === 'report_generated').length

  return {
    activeUsers: activeUserIds.size,
    activeFamilies: activeHouseholdIds.size,
    learnersCreated: events.filter(e => e.eventType === 'learner_created').length,
    sessionsLogged: countByType(events, SESSION_LOG_TYPES),
    completionEvents: countByType(events, COMPLETION_TYPES),
    deenRecordsCreated: countByType(events, DEEN_TYPES),
    evidenceItemsCreated: events.filter(e => e.eventType === 'evidence_created').length,
    reportsGenerated: events.filter(e => e.eventType === 'report_generated').length,
    attendanceEventsLogged: 0,
    periodStart,
    periodEnd,
    previousPeriodComparison: {
      activeUsersDelta: activeUserIds.size - prevActiveUsers,
      sessionsDelta: countByType(events, SESSION_LOG_TYPES) - prevSessions,
      evidenceReportsDelta: curEvidenceReports - prevEvidenceReports,
    },
  }
}

export function filterAndSortUserRows(
  rows: AdminMetricsUserRow[],
  query: AdminMetricsQuery,
): AdminMetricsUserRow[] {
  let filtered = rows

  if (query.activeOnly) {
    filtered = filtered.filter(r => r.isActiveInPeriod)
  }
  if (query.workspaceId) {
    filtered = filtered.filter(r => r.workspaceId === query.workspaceId)
  }
  if (query.featureArea) {
    filtered = filtered.filter(r => (r.featureUsageByArea[query.featureArea!] ?? 0) > 0)
  }
  if (query.dropOff) {
    filtered = filtered.filter(r => r.dropOffSignals.includes(query.dropOff!))
  }
  if (query.search) {
    const q = query.search.toLowerCase()
    filtered = filtered.filter(
      r =>
        r.workspaceName.toLowerCase().includes(q) ||
        (r.userEmail?.toLowerCase().includes(q) ?? false) ||
        r.learnerNames.some(name => name.toLowerCase().includes(q)) ||
        (r.members ?? []).some(
          m => m.email.toLowerCase().includes(q) || (m.name?.toLowerCase().includes(q) ?? false),
        ),
    )
  }

  filtered.sort((a, b) => {
    const aDate = a.lastActiveAt ?? ''
    const bDate = b.lastActiveAt ?? ''
    return bDate.localeCompare(aDate)
  })

  return filtered
}

export function paginateRows<T>(rows: T[], page: number, pageSize: number): { rows: T[]; total: number } {
  const total = rows.length
  const start = (page - 1) * pageSize
  return { rows: rows.slice(start, start + pageSize), total }
}

export function defaultPeriodRange(): { periodStart: string; periodEnd: string; previousStart: string; previousEnd: string } {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - 29)
  const prevEnd = new Date(start)
  prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd)
  prevStart.setDate(prevStart.getDate() - 29)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return {
    periodStart: fmt(start),
    periodEnd: fmt(end),
    previousStart: fmt(prevStart),
    previousEnd: fmt(prevEnd),
  }
}

export function parsePeriodFromSearchParams(
  searchParams: URLSearchParams,
): { periodStart: string; periodEnd: string; previousStart: string; previousEnd: string } {
  const defaults = defaultPeriodRange()
  const periodStart = searchParams.get('periodStart') ?? defaults.periodStart
  const periodEnd = searchParams.get('periodEnd') ?? defaults.periodEnd
  const startMs = new Date(`${periodStart}T00:00:00Z`).getTime()
  const endMs = new Date(`${periodEnd}T00:00:00Z`).getTime()
  const span = endMs - startMs
  const prevEnd = new Date(startMs - 86400000)
  const prevStart = new Date(prevEnd.getTime() - span)
  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  return {
    periodStart,
    periodEnd,
    previousStart: fmt(prevStart),
    previousEnd: fmt(prevEnd),
  }
}

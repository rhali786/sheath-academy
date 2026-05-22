export type FeatureArea =
  | 'account'
  | 'learners'
  | 'planner'
  | 'attendance'
  | 'quran'
  | 'arabic'
  | 'islamic_studies'
  | 'portfolio'
  | 'reports'
  | 'admin'

export type UsageEventType =
  | 'user_active'
  | 'family_created'
  | 'learner_created'
  | 'session_started'
  | 'session_completed'
  | 'session_abandoned'
  | 'lesson_completed'
  | 'quran_record_created'
  | 'arabic_record_created'
  | 'islamic_studies_record_created'
  | 'evidence_created'
  | 'report_generated'
  | 'feature_viewed'

export type DropOffSignal =
  | 'learners_no_activity'
  | 'started_not_completed'
  | 'activity_no_evidence'
  | 'records_no_report'
  | 'inactive_30_days'

export interface UsageEvent {
  id: string
  eventType: UsageEventType
  userId: string
  householdId: string
  learnerId?: string
  featureArea: FeatureArea
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  occurredAt: string
}

export interface TrackUsageEventInput {
  eventType: UsageEventType
  userId: string
  householdId: string
  learnerId?: string
  featureArea: FeatureArea
  entityType?: string
  entityId?: string
  metadata?: Record<string, unknown>
  occurredAt?: Date
}

export interface AdminMetricsSummary {
  activeUsers: number
  activeFamilies: number
  learnersCreated: number
  sessionsLogged: number
  completionEvents: number
  deenRecordsCreated: number
  evidenceItemsCreated: number
  reportsGenerated: number
  periodStart: string
  periodEnd: string
  previousPeriodComparison: {
    activeUsersDelta: number
    sessionsDelta: number
    evidenceReportsDelta: number
  }
}

export interface AdminMetricsUserRow {
  userId: string
  userName?: string
  userEmail?: string
  workspaceId: string
  workspaceName: string
  workspaceType?: 'family' | 'program'
  isActiveInPeriod: boolean
  lastActiveAt?: string
  learnerCount: number
  learnerNames: string[]
  lessonTasksInPeriod: number
  lessonsCompletedInPeriod: number
  sessionsLogged: number
  completionEvents: number
  startedNotCompletedCount: number
  quranRecordsCreated: number
  arabicRecordsCreated: number
  islamicStudiesRecordsCreated: number
  deenRecordsCreated: number
  evidenceItemsCreated: number
  reportsGenerated: number
  featureUsageByArea: Partial<Record<FeatureArea, number>>
  dropOffSignals: DropOffSignal[]
}

export interface AdminMetricsUsersResult {
  rows: AdminMetricsUserRow[]
  total: number
  page: number
  pageSize: number
}

export interface AdminMetricsQuery {
  periodStart: string
  periodEnd: string
  activeOnly?: boolean
  featureArea?: FeatureArea
  dropOff?: DropOffSignal
  workspaceId?: string
  search?: string
  page?: number
  pageSize?: number
}

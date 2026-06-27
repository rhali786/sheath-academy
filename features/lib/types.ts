// TypeScript interfaces for all dashboard data models
import type { Alert } from '@/features/alerts/types'

export interface Child {
  id: string
  name: string
  age: number
  grade: number
  avatar: string
}

export interface StudentProfile {
  id: string
  householdId: string
  name: string
  firstName?: string
  lastName?: string
  gradeLabel: string
  dob?: string
  teacherName?: string
  username: string
  password: string
  isActive: boolean
  learnerLoginEnabled?: boolean
  avatarInitials?: string
  createdAt: string
}

export interface Task {
  id: string
  childId: string
  subject: string
  description: string
  status: string
  completed: boolean
}

export type { Alert, AlertStatus, AlertSeverity, AlertSourceFeature } from '@/features/alerts/types'

export interface QuranSession {
  id: string
  childId: string
  type: string
  surah: string
  fromAyah: number
  toAyah: number
  notes: string
  date: string
  lastLogged: string
}

export interface DashboardRecord {
  id: string
  title: string
  count: number
  maxCount?: number
  icon: string
  viewButton: string
}

export interface DashboardMetrics {
  attendanceReady: string
  lessonsPlanned: number
  needsAttention: number
  quranLogged: string
  portfolioItems: number
  tasksCompleted: number
  tasksInProgress: number
  tasksOverdue: number
}

export interface SubjectProgress {
  subject: string
  completion: number
}

export interface ChildProgress {
  childName: string
  subjects: SubjectProgress[]
  quranCurrent?: string
  streak?: number
  lastLogged?: string
}

export interface ProgressData {
  [childId: string]: ChildProgress
}

export interface QuranSessionRequest {
  childId: string
  type: string
  surah: string
  fromAyah: number
  toAyah: number
  notes?: string
}

export interface TaskCompleteRequest {
  completed: boolean
}

export interface ApiResponse<T> {
  status: string
  data: T
  message: string
  timestamp: string
}

export interface Workspace {
  id: string
  name: string
  ownerId: string
  createdAt: string
}

export type DayOfWeek = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday'
export type DayLoadPreference = 'Off' | 'Light' | 'Normal' | 'Heavy'
export type DateDisplayPreference = 'gregorian' | 'gregorian-hijri-en' | 'bilingual'

export interface HouseholdProfile {
  id: string
  workspaceId: string
  familyName: string
  weekStartDay?: DayOfWeek
  schoolDays?: DayOfWeek[]
  dayLoad?: Partial<Record<DayOfWeek, DayLoadPreference>>
  reportingName?: string
  timezone?: string
  dateDisplay?: DateDisplayPreference
  jumuahLeaveWindow?: string
  jumuahReturnWindow?: string
  createdAt: string
}

export interface DataStore {
  workspaces: Workspace[]
  householdProfiles: HouseholdProfile[]
  children: Child[]
  studentProfiles: StudentProfile[]
  tasks: Task[]
  alerts: Alert[]
  quranSessions: QuranSession[]
  records: DashboardRecord[]
  progressData: {
    [childId: string]: SubjectProgress[]
  }
}

// ─── Cross-feature integration seams ──────────────────────────────────────────
// One living StudentRecord shared by gradebook + attendance + compliance +
// gamification (Gradebook brief §9). These are typed contracts only; each
// feature ships a mock adapter now and a real adapter later with no schema
// change. Do not put feature-owned domain types here — only the seam shapes.

/**
 * The shared identity space for a single learner's record. Every seam keys off
 * this so a single captured artifact can become grade + evidence + attendance +
 * mastery event without duplication.
 */
export interface StudentRecordKey {
  householdId: string
  learnerId: string
}

/** A mark ingested from a grading/work-capture source into the gradebook. */
export interface GradingMark {
  subjectId: string
  assignmentTitle: string
  value: string
  valueType: 'numeric' | 'percent' | 'letter' | 'rubric' | 'mastery' | 'completion'
  source: 'auto' | 'parent' | 'publisher' | 'outside' | 'ai'
  evidenceRefs?: string[]
  occurredAt: string
  comment?: string
}

/** Ingests evidence-rich marks + work samples into Attempt/Score. */
export interface GradingSource {
  ingestMark(record: StudentRecordKey, mark: GradingMark): Promise<{ attemptId: string; scoreId: string }>
}

/** Attendance rollup used by the combined PDF bundle + credits-from-hours. */
export interface AttendanceSummary {
  daysPresent: number
  totalMinutes: number
  rangeStart: string
  rangeEnd: string
}

/** Supplies attendance for compliance/gradebook consumers. */
export interface AttendanceSource {
  getAttendanceSummary(record: StudentRecordKey, rangeStart: string, rangeEnd: string): Promise<AttendanceSummary>
}

/** A records payload handed to compliance for state reporting. */
export interface StateReportRequest {
  record: StudentRecordKey
  state: string
  schoolYearId?: string
  rangeStart: string
  rangeEnd: string
}

export interface StateReportResult {
  state: string
  format: string
  /** Stored-copy ref (e.g. generated document id) or null when state is unverified. */
  storedRef: string | null
  verified: boolean
  message: string
}

/** Consumes records for state reporting. Shared by gradebook + compliance. */
export interface ComplianceSink {
  exportForState(request: StateReportRequest): Promise<StateReportResult>
}

/** Domain events the gradebook EMITS; gamification decides the response. */
export type GamificationEvent =
  | { type: 'score.recorded'; record: StudentRecordKey; subjectId: string; scoreId: string }
  | { type: 'mastery.achieved'; record: StudentRecordKey; subjectId: string; skill: string }
  | { type: 'evidence.linked'; record: StudentRecordKey; evidenceId: string }

/** The gradebook (and others) emit; gamification listens. Never owns reward logic. */
export interface GamificationEmitter {
  emit(event: GamificationEvent): Promise<void>
}

export interface ChartDataPoint {
  x: string
  y: number
}

export interface ChartSeries {
  id: string
  color: string
  data: ChartDataPoint[]
}

export interface NivoLineSeries {
  id: string
  color: string
  data: ChartDataPoint[]
}

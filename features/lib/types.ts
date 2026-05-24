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

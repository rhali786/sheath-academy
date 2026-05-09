// TypeScript interfaces for all dashboard data models

export interface Child {
  id: string
  name: string
  age: number
  grade: number
  avatar: string
}

export interface Task {
  id: string
  childId: string
  subject: string
  description: string
  status: string
  completed: boolean
}

export interface Alert {
  id: string
  childId: string | null
  title: string
  detail: string
  priority: string
  actionButton: string
}

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

export interface DataStore {
  children: Child[]
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

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

export type { Alert } from '@/features/alerts/types'

export interface QuranSession {
  id: string
  childId: string
  type: string
  surah: string
  fromAyah: number
  toAyah: number
  notes?: string
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

export interface SubjectProgress {
  subject: string
  completion: number
}

export interface ChildProgress {
  childName: string
  subjects: SubjectProgress[]
  quranCurrent: string
  streak: number
  lastLogged: string
}

export interface ChartDataPoint {
  x: string
  y: number
}

export interface NivoLineSeries {
  id: string
  color: string
  data: ChartDataPoint[]
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

export interface ApiResponse<T> {
  status: string
  data: T
  message: string
  timestamp: string
}

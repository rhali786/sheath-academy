import type { Child, Task, Alert, QuranSession, DashboardRecord, DashboardMetrics } from '@/features/lib/types'

export const mockChildren: Child[] = [
  { id: 'layth_001',   name: 'Layth',   age: 10, grade: 4, avatar: 'L' },
  { id: 'hawa_001',    name: 'Hawa',    age: 7,  grade: 1, avatar: 'H' },
  { id: 'talut_001',   name: 'Talut',   age: 13, grade: 7, avatar: 'T' },
  { id: 'samurai_001', name: 'Samurai', age: 10, grade: 4, avatar: 'S' },
]

export const mockTasks: Task[] = [
  {
    id: 'task_001',
    childId: 'layth_001',
    subject: 'Math',
    description: 'Multiplication tables 7–9',
    status: 'in-progress',
    completed: false,
  },
  {
    id: 'task_002',
    childId: 'hawa_001',
    subject: 'English',
    description: 'Letter sounds worksheet',
    status: 'pending',
    completed: false,
  },
  {
    id: 'task_003',
    childId: 'family',
    subject: 'Quran',
    description: 'Friday family Quran circle',
    status: 'in-progress',
    completed: true,
  },
]

export const mockAlerts: Alert[] = [
  {
    id: 'alert_001',
    childId: 'talut_001',
    childName: 'Talut',
    href: '/lessons',
    date: '2026-05-17',
    type: 'pending_lessons',
    status: 'open',
    severity: 'high',
    title: '3 lessons not completed',
    message: '3 overdue: Algebra review, Essay draft, Science lab',
    sourceFeature: 'planner',
    createdAt: '2026-05-17T08:00:00Z',
  },
  {
    id: 'alert_002',
    childId: null,
    href: '/attendance',
    date: '2026-05-17',
    type: 'attendance_missing',
    status: 'open',
    severity: 'medium',
    title: 'Attendance not logged today',
    message: 'Missing for: Layth, Hawa',
    sourceFeature: 'attendance',
    createdAt: '2026-05-17T09:00:00Z',
  },
]

export const mockQuranSessions: QuranSession[] = [
  {
    id: 'quran_001',
    childId: 'layth_001',
    type: 'New memorisation',
    surah: 'Al-Mulk',
    fromAyah: 1,
    toAyah: 5,
    date: new Date().toISOString(),
    notes: 'Good focus',
    lastLogged: 'Today',
  },
  {
    id: 'quran_002',
    childId: 'hawa_001',
    type: 'Revision',
    surah: 'Al-Ikhlas',
    fromAyah: 1,
    toAyah: 4,
    date: new Date().toISOString(),
    notes: '',
    lastLogged: 'Today',
  },
]

export const mockRecords: DashboardRecord[] = [
  {
    id: 'record_001',
    title: 'Attendance',
    count: 16,
    maxCount: 20,
    icon: 'CheckCircle',
    viewButton: 'View',
  },
]

export const mockMetrics: DashboardMetrics = {
  attendanceReady: '4/4',
  lessonsPlanned: 40,
  needsAttention: 3,
  quranLogged: '58 sessions',
  portfolioItems: 8,
  tasksCompleted: 8,
  tasksInProgress: 1,
  tasksOverdue: 2,
}

export const mockProgressData = {
  layth_001: {
    subjects: [
      { subject: 'Math', completion: 80 },
      { subject: 'English', completion: 85 },
      { subject: 'Science', completion: 75 },
    ]
  },
  hawa_001: {
    subjects: [
      { subject: 'Math', completion: 70 },
      { subject: 'English', completion: 90 },
      { subject: 'Islamic Studies', completion: 95 },
    ]
  },
  talut_001: {
    subjects: [
      { subject: 'Math', completion: 88 },
      { subject: 'Science', completion: 92 },
      { subject: 'Islamic Studies', completion: 97 },
    ]
  },
}

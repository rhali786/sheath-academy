import type { Child, Task, Alert, QuranSession, DashboardRecord, DashboardMetrics } from '@/features/lib/types'

export const mockChildren: Child[] = [
  { id: 'adam_001', name: 'Adam', age: 11, grade: 5, avatar: 'A' },
  { id: 'khadijah_001', name: 'Khadijah', age: 8, grade: 3, avatar: 'K' },
  { id: 'zayd_001', name: 'Zayd', age: 14, grade: 8, avatar: 'Z' },
]

export const mockTasks: Task[] = [
  {
    id: 'task_001',
    childId: 'adam_001',
    subject: 'Math',
    description: 'Complete Ch 5 exercises',
    status: 'in-progress',
    completed: false,
  },
  {
    id: 'task_002',
    childId: 'khadijah_001',
    subject: 'Reading',
    description: 'Read 20 pages',
    status: 'pending',
    completed: false,
  },
  {
    id: 'task_003',
    childId: 'family',
    subject: 'Quran',
    description: 'Group Halaqa',
    status: 'in-progress',
    completed: true,
  },
]

export const mockAlerts: Alert[] = [
  {
    id: 'alert_001',
    childId: 'zayd_001',
    message: 'Missing weekly portfolio update',
    type: 'warning',
    priority: 'amber',
  },
  {
    id: 'alert_002',
    childId: 'adam_001',
    message: 'Math test score below target',
    type: 'error',
    priority: 'red',
  },
]

export const mockQuranSessions: QuranSession[] = [
  {
    id: 'quran_001',
    childId: 'adam_001',
    type: 'New memorization',
    surah: 'Al-Mulk',
    fromAyah: 1,
    toAyah: 5,
    date: new Date().toISOString(),
    notes: 'Smooth',
  },
  {
    id: 'quran_002',
    childId: 'khadijah_001',
    type: 'Revision',
    surah: 'Al-Ikhlas',
    fromAyah: 1,
    toAyah: 4,
    date: new Date().toISOString(),
    notes: '',
  },
]

export const mockRecords: DashboardRecord[] = [
  {
    id: 'record_001',
    category: 'Attendance',
    child: 'Adam',
    subject: 'Math',
    description: 'Present for 4/5 days',
    icon: '✓',
    action: 'View Details',
  },
]

export const mockMetrics: DashboardMetrics = {
  attendanceReady: '3/5',
  lessonsPlanned: 2,
  needsAttention: 2,
  quranLogged: '1 session',
  portfolioItems: 1,
}

export const mockProgressData = {
  adam_001: {
    subjects: [
      { subject: 'Math', completion: 75 },
      { subject: 'English', completion: 85 },
      { subject: 'Science', completion: 70 },
    ]
  },
  khadijah_001: {
    subjects: [
      { subject: 'Math', completion: 65 },
      { subject: 'English', completion: 90 },
      { subject: 'Science', completion: 60 },
    ]
  },
  zayd_001: {
    subjects: [
      { subject: 'Math', completion: 95 },
      { subject: 'English', completion: 80 },
      { subject: 'Science', completion: 92 },
    ]
  },
}

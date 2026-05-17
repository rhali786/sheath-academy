import type { Child, Task, DashboardRecord } from '@/features/lib/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const SEED_CHILDREN: Child[] = [
  { id: SEED_IDS.adam, name: 'Adam', age: 11, grade: 5, avatar: 'A' },
  { id: SEED_IDS.khadijah, name: 'Khadijah', age: 8, grade: 3, avatar: 'K' },
  { id: SEED_IDS.zayd, name: 'Zayd', age: 14, grade: 8, avatar: 'Z' },
]

export const SEED_TASKS: Task[] = [
  // Adam's tasks
  {
    id: 'task_001',
    childId: SEED_IDS.adam,
    subject: 'QURAN',
    description: 'Al-Mulk 1–5 revision',
    status: 'Overdue',
    completed: false,
  },
  {
    id: 'task_002',
    childId: SEED_IDS.adam,
    subject: 'ARABIC',
    description: 'Copywork — letter forms ت ث ج',
    status: 'Ready',
    completed: false,
  },
  {
    id: 'task_003',
    childId: SEED_IDS.adam,
    subject: 'MATH',
    description: 'Fractions practice set 3',
    status: 'Ready',
    completed: false,
  },
  {
    id: 'task_004',
    childId: SEED_IDS.adam,
    subject: 'ISLAMIC STUDIES',
    description: 'Unit 3, Lesson 2 — read discussion',
    status: 'Ready',
    completed: false,
  },
  {
    id: 'task_005',
    childId: SEED_IDS.adam,
    subject: 'READING',
    description: 'Chapter 5 comprehension',
    status: 'Ready',
    completed: true,
  },
  // Khadijah's tasks
  {
    id: 'task_006',
    childId: SEED_IDS.khadijah,
    subject: 'QURAN',
    description: 'New memorization — Surah al-Alaq 1–3',
    status: 'Ready',
    completed: true,
  },
  {
    id: 'task_007',
    childId: SEED_IDS.khadijah,
    subject: 'READING',
    description: 'Story lesson ch. 4',
    status: 'Ready',
    completed: true,
  },
  {
    id: 'task_008',
    childId: SEED_IDS.khadijah,
    subject: 'SCIENCE',
    description: 'Nature notebook — observation walk',
    status: 'Ready',
    completed: false,
  },
  {
    id: 'task_009',
    childId: SEED_IDS.khadijah,
    subject: 'ARABIC',
    description: 'Letter recognition worksheet',
    status: 'Ready',
    completed: false,
  },
  // Zayd's tasks
  {
    id: 'task_010',
    childId: SEED_IDS.zayd,
    subject: 'QURAN',
    description: 'Recitation review — juz 30',
    status: 'Ready',
    completed: false,
  },
  {
    id: 'task_011',
    childId: SEED_IDS.zayd,
    subject: 'ENGLISH',
    description: 'Comprehension essays',
    status: 'Ready',
    completed: false,
  },
  {
    id: 'task_012',
    childId: SEED_IDS.zayd,
    subject: 'SCIENCE',
    description: 'Lab notebook write-up',
    status: 'Ready',
    completed: true,
  },
  {
    id: 'task_013',
    childId: SEED_IDS.zayd,
    subject: 'MATH',
    description: 'Algebra review — quadratic equations',
    status: 'Overdue',
    completed: false,
  },
  {
    id: 'task_014',
    childId: SEED_IDS.zayd,
    subject: 'HISTORY',
    description: 'Ottoman Empire research paper',
    status: 'Overdue',
    completed: false,
  },
  // Family task
  {
    id: 'task_015',
    childId: 'family',
    subject: 'ISLAMIC STUDIES',
    description: 'Unit 3, Lesson 2 — read, discuss, portfolio prompt',
    status: 'Ready',
    completed: false,
  },
]

export const SEED_RECORDS: DashboardRecord[] = [
  {
    id: 'record_001',
    title: 'Attendance',
    count: 4,
    maxCount: 5,
    icon: 'CheckCircle',
    viewButton: 'View',
  },
  {
    id: 'record_002',
    title: 'Progress updates',
    count: 8,
    maxCount: 15,
    icon: 'TrendingUp',
    viewButton: 'View',
  },
  {
    id: 'record_003',
    title: 'Portfolio evidence',
    count: 4,
    maxCount: 10,
    icon: 'Folder',
    viewButton: 'View',
  },
  {
    id: 'record_004',
    title: 'Quran sessions',
    count: 11,
    maxCount: 21,
    icon: 'BookOpen',
    viewButton: 'View',
  },
]

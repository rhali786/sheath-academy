import type { Child, Task, DashboardRecord } from '@/features/lib/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const SEED_CHILDREN: Child[] = [
  { id: SEED_IDS.layth,   name: 'Layth',   age: 10, grade: 4, avatar: 'L' },
  { id: SEED_IDS.hawa,    name: 'Hawa',    age: 7,  grade: 1, avatar: 'H' },
  { id: SEED_IDS.talut,   name: 'Talut',   age: 13, grade: 7, avatar: 'T' },
  { id: SEED_IDS.samurai, name: 'Samurai', age: 10, grade: 4, avatar: 'S' },
]

export const SEED_TASKS: Task[] = [
  // Layth's tasks
  { id: 'task_001', childId: SEED_IDS.layth,   subject: 'ISLAMIC STUDIES', description: 'Five pillars review', status: 'Ready',   completed: false },
  { id: 'task_002', childId: SEED_IDS.layth,   subject: 'MATH',            description: 'Multiplication tables 7–9', status: 'Ready', completed: false },
  { id: 'task_003', childId: SEED_IDS.layth,   subject: 'ENGLISH',         description: 'Reading comprehension ch. 3', status: 'Ready', completed: true },
  { id: 'task_004', childId: SEED_IDS.layth,   subject: 'SCIENCE',         description: 'Plant life cycle diagram', status: 'Overdue', completed: false },
  // Hawa's tasks
  { id: 'task_005', childId: SEED_IDS.hawa,    subject: 'ISLAMIC STUDIES', description: 'Surah Al-Ikhlas practice', status: 'Ready',   completed: true },
  { id: 'task_006', childId: SEED_IDS.hawa,    subject: 'ENGLISH',         description: 'Letter sounds worksheet', status: 'Ready',   completed: false },
  { id: 'task_007', childId: SEED_IDS.hawa,    subject: 'MATH',            description: 'Counting to 100 activity', status: 'Ready',   completed: true },
  // Talut's tasks
  { id: 'task_008', childId: SEED_IDS.talut,   subject: 'ISLAMIC STUDIES', description: 'Seerah — Battle of Badr', status: 'Ready',   completed: false },
  { id: 'task_009', childId: SEED_IDS.talut,   subject: 'MATH',            description: 'Algebra — linear equations', status: 'Overdue', completed: false },
  { id: 'task_010', childId: SEED_IDS.talut,   subject: 'SCIENCE',         description: 'Lab write-up: evaporation', status: 'Ready',   completed: true },
  { id: 'task_011', childId: SEED_IDS.talut,   subject: 'ENGLISH',         description: 'Essay — descriptive writing', status: 'Ready', completed: false },
  { id: 'task_012', childId: SEED_IDS.talut,   subject: 'LANGUAGE ARTS',   description: 'Comprehension: The Giver ch. 5', status: 'Ready', completed: true },
  // Samurai's tasks
  { id: 'task_013', childId: SEED_IDS.samurai, subject: 'ISLAMIC STUDIES', description: 'Names of Allah — 10 review', status: 'Ready',   completed: false },
  { id: 'task_014', childId: SEED_IDS.samurai, subject: 'MATH',            description: 'Long division practice', status: 'Ready',     completed: false },
  { id: 'task_015', childId: SEED_IDS.samurai, subject: 'TECHNOLOGY',      description: 'Typing — 15 min TypingClub', status: 'Ready',  completed: true },
  // Family task
  { id: 'task_016', childId: 'family',         subject: 'ISLAMIC STUDIES', description: 'Family Quran circle — Friday after Asr', status: 'Ready', completed: false },
]

export const SEED_RECORDS: DashboardRecord[] = [
  { id: 'record_001', title: 'Attendance',       count: 16, maxCount: 20, icon: 'CheckCircle', viewButton: 'View' },
  { id: 'record_002', title: 'Progress updates', count: 40, maxCount: 50, icon: 'TrendingUp',  viewButton: 'View' },
  { id: 'record_003', title: 'Portfolio evidence', count: 8, icon: 'Folder',   viewButton: 'View' },
  { id: 'record_004', title: 'Quran sessions',   count: 58, icon: 'BookOpen', viewButton: 'View' },
]

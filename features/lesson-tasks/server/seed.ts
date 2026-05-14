import type { LessonTask } from '@/features/lesson-tasks/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const SEED_LESSON_TASKS: LessonTask[] = [
  {
    id: 'lesson_task_seed_001',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_002', // Adam — Mathematics
    title: 'Fractions worksheet — pages 12–14',
    date: '2026-05-11',
    status: 'not_started',
    notes: 'Complete all exercises, show working out.',
    createdAt: '2026-05-11T07:00:00.000Z',
    updatedAt: '2026-05-11T07:00:00.000Z',
  },
  {
    id: 'lesson_task_seed_002',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_001', // Adam — Quran Memorisation
    title: 'Revise Surah Al-Mulk verses 1–10',
    date: '2026-05-12',
    status: 'completed',
    createdAt: '2026-05-11T07:00:00.000Z',
    updatedAt: '2026-05-12T09:30:00.000Z',
  },
  {
    id: 'lesson_task_seed_003',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_004', // Khadijah — Quran Memorisation
    title: 'Memorise Surah Al-Fajr',
    date: '2026-05-13',
    status: 'not_started',
    resourceLink: 'https://quran.com/89',
    createdAt: '2026-05-11T07:00:00.000Z',
    updatedAt: '2026-05-11T07:00:00.000Z',
  },
  {
    id: 'lesson_task_seed_004',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_005', // Khadijah — Reading
    title: 'Read chapter 7 of The Lion, the Witch and the Wardrobe',
    date: '2026-05-14',
    status: 'skipped',
    createdAt: '2026-05-11T07:00:00.000Z',
    updatedAt: '2026-05-14T11:00:00.000Z',
  },
  {
    id: 'lesson_task_seed_005',
    childId: SEED_IDS.zayd,
    subjectId: 'subject_seed_006', // Zayd — Islamic Studies
    title: 'Study the five pillars of Islam',
    date: '2026-05-15',
    status: 'not_started',
    createdAt: '2026-05-11T07:00:00.000Z',
    updatedAt: '2026-05-11T07:00:00.000Z',
  },
]

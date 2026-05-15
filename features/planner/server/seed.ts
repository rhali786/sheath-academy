import { LessonTask } from '../types'
import { SEED_IDS } from '@/features/lib/seedIds'

function formatLocalDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function getMondayOfCurrentWeek(): Date {
  const today = new Date()
  const dayOfWeek = today.getDay()
  const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysFromMonday)
}

const weekMonday = getMondayOfCurrentWeek()

function getDateForDay(dayOffset: number): string {
  const d = new Date(weekMonday.getFullYear(), weekMonday.getMonth(), weekMonday.getDate() + dayOffset)
  return formatLocalDate(d)
}

export const SEED_LESSONS: LessonTask[] = [
  // Adam's lessons - Math, Quran
  // Monday
  {
    id: 'lesson_seed_001',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_002', // Mathematics
    householdId: SEED_IDS.household,
    title: 'Math Lesson 1 - Fractions',
    description: 'Review basic fractions and simplification',
    dueDate: getDateForDay(0), // Monday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Tuesday
  {
    id: 'lesson_seed_002',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_001', // Quran Memorisation
    householdId: SEED_IDS.household,
    title: 'Quran Practice - Surah Al-Fatihah',
    description: 'Continue memorization of Surah Al-Fatihah',
    dueDate: getDateForDay(1), // Tuesday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Wednesday
  {
    id: 'lesson_seed_003',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_002', // Mathematics
    householdId: SEED_IDS.household,
    title: 'Math Lesson 2 - Decimals',
    description: 'Introduction to decimal notation and operations',
    dueDate: getDateForDay(2), // Wednesday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Thursday
  {
    id: 'lesson_seed_004',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_001', // Quran Memorisation
    householdId: SEED_IDS.household,
    title: 'Quran Recitation',
    description: 'Practice recitation with tajweed',
    dueDate: getDateForDay(3), // Thursday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Friday
  {
    id: 'lesson_seed_005',
    childId: SEED_IDS.adam,
    subjectId: 'subject_seed_002', // Mathematics
    householdId: SEED_IDS.household,
    title: 'Math Lesson 3 - Percentages',
    description: 'Understanding percentages and conversions',
    dueDate: getDateForDay(4), // Friday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // Khadijah's lessons - Reading, Quran
  // Monday
  {
    id: 'lesson_seed_006',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_005', // Reading
    householdId: SEED_IDS.household,
    title: 'Reading Practice - Chapter 1',
    description: 'Read and discuss Chapter 1 from the assigned book',
    dueDate: getDateForDay(0), // Monday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Tuesday
  {
    id: 'lesson_seed_007',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_004', // Quran Memorisation
    householdId: SEED_IDS.household,
    title: 'Quran Hifz - Surah Al-Nas',
    description: 'Memorize Surah Al-Nas',
    dueDate: getDateForDay(1), // Tuesday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Wednesday
  {
    id: 'lesson_seed_008',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_005', // Reading
    householdId: SEED_IDS.household,
    title: 'Reading Comprehension - Chapter 2',
    description: 'Answer comprehension questions for Chapter 2',
    dueDate: getDateForDay(2), // Wednesday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Thursday
  {
    id: 'lesson_seed_009',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_004', // Quran Memorisation
    householdId: SEED_IDS.household,
    title: 'Quran Review',
    description: 'Review previously memorized surahs',
    dueDate: getDateForDay(3), // Thursday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Friday
  {
    id: 'lesson_seed_010',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_005', // Reading
    householdId: SEED_IDS.household,
    title: 'Reading - Vocabulary Building',
    description: 'Learn new vocabulary words from Chapter 3',
    dueDate: getDateForDay(4), // Friday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Saturday (Weekend lesson)
  {
    id: 'lesson_seed_011',
    childId: SEED_IDS.khadijah,
    subjectId: 'subject_seed_004', // Quran Memorisation
    householdId: SEED_IDS.household,
    title: 'Quran Weekend Practice',
    description: 'Extended Quran practice session',
    dueDate: getDateForDay(5), // Saturday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // Zayd's lessons - Islamic Studies, History
  // Monday
  {
    id: 'lesson_seed_012',
    childId: SEED_IDS.zayd,
    subjectId: 'subject_seed_006', // Islamic Studies
    householdId: SEED_IDS.household,
    title: 'Islamic History - Early Caliphate',
    description: 'Study the early Islamic caliphate period',
    dueDate: getDateForDay(0), // Monday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Wednesday
  {
    id: 'lesson_seed_013',
    childId: SEED_IDS.zayd,
    subjectId: 'subject_seed_007', // History
    householdId: SEED_IDS.household,
    title: 'History Lesson - Medieval Period',
    description: 'Explore significant events of the Medieval period',
    dueDate: getDateForDay(2), // Wednesday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Thursday
  {
    id: 'lesson_seed_014',
    childId: SEED_IDS.zayd,
    subjectId: 'subject_seed_006', // Islamic Studies
    householdId: SEED_IDS.household,
    title: 'Islamic Studies - Fiqh Basics',
    description: 'Introduction to basic Islamic jurisprudence',
    dueDate: getDateForDay(3), // Thursday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  // Sunday (Weekend lesson)
  {
    id: 'lesson_seed_015',
    childId: SEED_IDS.zayd,
    subjectId: 'subject_seed_007', // History
    householdId: SEED_IDS.household,
    title: 'History Research Project',
    description: 'Research and compile notes for history project',
    dueDate: getDateForDay(6), // Sunday
    status: 'not_started',
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
]

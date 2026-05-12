import type { SubjectCourse } from '@/features/subjects/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const MOCK_SUBJECTS: SubjectCourse[] = [
  {
    id: 'subject_seed_001',
    childId: SEED_IDS.adam,
    name: 'Quran Memorisation',
    category: 'Quran',
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'subject_seed_002',
    childId: SEED_IDS.adam,
    name: 'Mathematics',
    category: 'Math',
    isActive: true,
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'subject_seed_003',
    childId: SEED_IDS.khadijah,
    name: 'Arabic Language',
    category: 'Arabic',
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

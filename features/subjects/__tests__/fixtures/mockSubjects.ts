import type { SubjectCourse } from '@/features/subjects/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const MOCK_SUBJECTS: SubjectCourse[] = [
  {
    id: 'subject_seed_001',
    childId: SEED_IDS.layth,
    name: 'Islamic Studies',
    category: 'IslamicStudies',
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'subject_seed_002',
    childId: SEED_IDS.layth,
    name: 'Mathematics',
    category: 'Math',
    isActive: true,
    order: 2,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'subject_seed_007',
    childId: SEED_IDS.hawa,
    name: 'Islamic Studies',
    category: 'IslamicStudies',
    isActive: true,
    order: 1,
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

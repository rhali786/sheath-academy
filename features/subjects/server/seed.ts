import type { SubjectCourse, SubjectCourseCategory } from '@/features/subjects/types'
import { SEED_IDS } from '@/features/lib/seedIds'

// Subject IDs: 001-006 Layth, 007-012 Hawa, 013-018 Talut, 019-024 Samurai
const SUBJECTS: { name: string; category: SubjectCourseCategory; order: number }[] = [
  { name: 'Islamic Studies', category: 'IslamicStudies', order: 1 },
  { name: 'Mathematics',     category: 'Math',           order: 2 },
  { name: 'English/ELA',     category: 'EnglishELA',     order: 3 },
  { name: 'Science',         category: 'Science',        order: 4 },
  { name: 'Reading',         category: 'Reading',        order: 5 },
  { name: 'Technology',      category: 'Technology',     order: 6 },
]

function makeSubjects(childId: string, idOffset: number): SubjectCourse[] {
  return SUBJECTS.map((s, i) => ({
    id: `subject_seed_${String(idOffset + i + 1).padStart(3, '0')}`,
    childId,
    learnerIds: [childId],
    name: s.name,
    category: s.category,
    isActive: true,
    order: s.order,
    createdAt: '2026-01-01T00:00:00.000Z',
  }))
}

export const SEED_SUBJECTS: SubjectCourse[] = [
  ...makeSubjects(SEED_IDS.layth,   0),   // subject_seed_001 – 006
  ...makeSubjects(SEED_IDS.hawa,    6),   // subject_seed_007 – 012
  ...makeSubjects(SEED_IDS.talut,   12),  // subject_seed_013 – 018
  ...makeSubjects(SEED_IDS.samurai, 18),  // subject_seed_019 – 024
]

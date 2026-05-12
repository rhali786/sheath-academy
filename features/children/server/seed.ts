import type { StudentProfile } from '@/features/lib/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const SEED_STUDENT_PROFILES: StudentProfile[] = [
  {
    id: SEED_IDS.adam,
    householdId: SEED_IDS.household,
    name: 'Adam',
    gradeLabel: 'Grade 5',
    dob: '2014-03-15',
    teacherName: 'Mrs. Fatima',
    username: 'adam',
    password: 'password',
    isActive: true,
    avatarInitials: 'A',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: SEED_IDS.khadijah,
    householdId: SEED_IDS.household,
    name: 'Khadijah',
    gradeLabel: 'Grade 3',
    dob: '2017-07-22',
    teacherName: 'Mrs. Aisha',
    username: 'khadijah',
    password: 'password',
    isActive: true,
    avatarInitials: 'K',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: SEED_IDS.zayd,
    householdId: SEED_IDS.household,
    name: 'Zayd',
    gradeLabel: 'Grade 8',
    dob: '2011-11-05',
    teacherName: 'Mr. Hassan',
    username: 'zayd',
    password: 'password',
    isActive: true,
    avatarInitials: 'Z',
    createdAt: '2026-01-01T00:00:00.000Z',
  },
]

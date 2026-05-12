import type { StudentProfile } from '@/features/lib/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const mockStudentProfiles: StudentProfile[] = [
  {
    id: SEED_IDS.adam,
    householdId: 'workspace_test',
    name: 'Adam',
    gradeLabel: 'Grade 5',
    dob: '2014-03-15',
    teacherName: 'Mrs. Fatima',
    username: 'adam.student',
    password: 'password123',
    isActive: true,
    avatarInitials: 'A',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: SEED_IDS.khadijah,
    householdId: 'workspace_test',
    name: 'Khadijah',
    gradeLabel: 'Grade 3',
    dob: '2017-07-22',
    teacherName: 'Mrs. Aisha',
    username: 'khadijah.student',
    password: 'password123',
    isActive: true,
    avatarInitials: 'K',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: SEED_IDS.zayd,
    householdId: 'workspace_test',
    name: 'Zayd',
    gradeLabel: 'Grade 8',
    dob: '2011-11-05',
    teacherName: 'Mr. Hassan',
    username: 'zayd.student',
    password: 'password123',
    isActive: false,
    avatarInitials: 'Z',
    createdAt: '2026-01-10T10:00:00Z',
  },
]

export const activeProfiles = mockStudentProfiles.filter(p => p.isActive)
export const archivedProfiles = mockStudentProfiles.filter(p => !p.isActive)

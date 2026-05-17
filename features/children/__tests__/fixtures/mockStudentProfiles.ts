import type { StudentProfile } from '@/features/lib/types'
import { SEED_IDS } from '@/features/lib/seedIds'

export const mockStudentProfiles: StudentProfile[] = [
  {
    id: SEED_IDS.layth,
    householdId: 'workspace_test',
    name: 'Layth',
    gradeLabel: 'Grade 4',
    dob: '2015-09-01',
    teacherName: 'Umm Talut',
    username: 'layth.student',
    password: 'password123',
    isActive: true,
    avatarInitials: 'L',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: SEED_IDS.hawa,
    householdId: 'workspace_test',
    name: 'Hawa',
    gradeLabel: 'Grade 1',
    dob: '2018-09-01',
    teacherName: 'Umm Talut',
    username: 'hawa.student',
    password: 'password123',
    isActive: true,
    avatarInitials: 'H',
    createdAt: '2026-01-10T10:00:00Z',
  },
  {
    id: SEED_IDS.talut,
    householdId: 'workspace_test',
    name: 'Talut',
    gradeLabel: 'Grade 7',
    dob: '2012-09-01',
    teacherName: 'Umm Talut',
    username: 'talut.student',
    password: 'password123',
    isActive: false,
    avatarInitials: 'T',
    createdAt: '2026-01-10T10:00:00Z',
  },
]

export const activeProfiles = mockStudentProfiles.filter(p => p.isActive)
export const archivedProfiles = mockStudentProfiles.filter(p => !p.isActive)

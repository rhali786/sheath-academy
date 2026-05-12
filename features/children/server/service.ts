import type { StudentProfile } from '@/features/lib/types'
import { studentProfilesStore } from './store'
import { SEED_STUDENT_PROFILES } from './seed'
import { generateStudentId, resetIdCounter } from './ids'

export function getStudentProfiles(householdId?: string): StudentProfile[] {
  const profiles = studentProfilesStore.getAll()
  if (householdId) {
    return profiles.filter(p => p.householdId === householdId)
  }
  return profiles
}

export function getStudentProfile(id: string): StudentProfile | null {
  return studentProfilesStore.getById(id) ?? null
}

export function createStudentProfile(
  data: Partial<StudentProfile> & {
    householdId: string
    name: string
    gradeLabel: string
    username: string
    password: string
  }
): StudentProfile {
  const profile: StudentProfile = {
    id: generateStudentId(),
    householdId: data.householdId,
    name: data.name,
    gradeLabel: data.gradeLabel,
    dob: data.dob,
    teacherName: data.teacherName,
    username: data.username,
    password: data.password,
    isActive: true,
    avatarInitials: data.avatarInitials || data.name.charAt(0).toUpperCase(),
    createdAt: new Date().toISOString(),
  }
  return studentProfilesStore.insert(profile)
}

export function updateStudentProfile(
  id: string,
  patch: Partial<StudentProfile>
): StudentProfile | null {
  const profile = studentProfilesStore.getById(id)
  if (!profile) return null

  const allowedPatch: Partial<StudentProfile> = {}
  if (patch.name !== undefined) allowedPatch.name = patch.name
  if (patch.gradeLabel !== undefined) allowedPatch.gradeLabel = patch.gradeLabel
  if (patch.dob !== undefined) allowedPatch.dob = patch.dob
  if (patch.teacherName !== undefined) allowedPatch.teacherName = patch.teacherName
  if (patch.username !== undefined) allowedPatch.username = patch.username
  if (patch.password !== undefined) allowedPatch.password = patch.password
  if (patch.avatarInitials !== undefined) allowedPatch.avatarInitials = patch.avatarInitials

  return studentProfilesStore.update(id, allowedPatch)
}

export function archiveStudentProfile(id: string): StudentProfile | null {
  if (!studentProfilesStore.getById(id)) return null
  return studentProfilesStore.update(id, { isActive: false })
}

export function restoreStudentProfile(id: string): StudentProfile | null {
  if (!studentProfilesStore.getById(id)) return null
  return studentProfilesStore.update(id, { isActive: true })
}

export function resetStore(): void {
  studentProfilesStore.reset(SEED_STUDENT_PROFILES)
  resetIdCounter()
}

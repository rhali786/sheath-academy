// Memory store removed. Stubs kept for compilation.
// Callers (alerts, records, setup, subjects) are pending Postgres migration.
// Use children/server/repository for new code.
import type { StudentProfile } from '@/features/lib/types'

export function getStudentProfiles(_householdId?: string): StudentProfile[] { return [] }
export function getStudentProfile(_id: string): StudentProfile | null { return null }
export function createStudentProfile(_data: unknown): StudentProfile { throw new Error('Use children/server/repository createLearner') }
export function updateStudentProfile(_id: string, _data: unknown): StudentProfile | null { return null }
export function archiveStudentProfile(_id: string): StudentProfile | null { return null }
export function restoreStudentProfile(_id: string): StudentProfile | null { return null }
export function resetStore(): void {}
export function seedStudentProfiles(_profiles: StudentProfile[]): void {}

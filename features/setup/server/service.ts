import { getWorkspace, getHouseholdProfile } from '@/features/household/server/service'
import { getStudentProfiles } from '@/features/children/server/service'
import { getSubjects } from '@/features/subjects/server/service'
import { getLessons } from '@/features/plan/server/service'
import { getRecords as getAttendanceRecords } from '@/features/attendance/server/service'
import { listEvidenceItems } from '@/features/portfolio/server/service'
import type { SetupStatus } from '../types'
import { getNextSetupStep, getCompletedSteps, type SetupState } from './rules'

export function getSetupStatus(): SetupStatus {
  const workspace = getWorkspace()
  const profile = getHouseholdProfile()
  const hasHousehold = Boolean(workspace && profile)

  const profiles = getStudentProfiles()
  const activeChildCount = profiles.filter((p) => p.isActive !== false).length

  const subjects = getSubjects()
  const activeSubjectCount = subjects.filter((s) => s.isActive !== false).length

  const hasLessons = getLessons().length > 0
  const hasAttendance = getAttendanceRecords({}).length > 0
  const hasPortfolio = listEvidenceItems({}).length > 0

  const state: SetupState = {
    hasHousehold,
    activeChildCount,
    activeSubjectCount,
    hasLessons,
    hasAttendance,
    hasPortfolio,
  }

  return {
    nextStep: getNextSetupStep(state),
    completed: getCompletedSteps(state),
  }
}

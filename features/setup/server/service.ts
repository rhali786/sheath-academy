import { getWorkspace, getHouseholdProfile } from '@/features/household/server/service'
import { getStudentProfiles } from '@/features/children/server/service'
import { getSubjects } from '@/features/subjects/server/service'
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

  const state: SetupState = {
    hasHousehold,
    activeChildCount,
    activeSubjectCount,
    hasLessons: false,
    hasAttendance: false,
    hasPortfolio: false,
  }

  return {
    nextStep: getNextSetupStep(state),
    completed: getCompletedSteps(state),
  }
}

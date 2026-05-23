import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listAllLearners } from '@/features/children/server/repository'
import { getHouseholdById } from '@/features/household/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listSubjectRows } from '@/features/subjects/server/repository'
import type { SetupStatus } from '../types'
import { getNextSetupStep, getCompletedSteps, type SetupState } from './rules'

export async function getSetupStatus(householdId: string): Promise<SetupStatus> {
  const household = await getHouseholdById(householdId)
  const profiles = await listAllLearners(householdId)
  const subjects = await listSubjectRows(householdId)
  const lessons = await listLessonTaskRows(householdId)
  const attendance = await listAttendanceEvents(householdId)
  const evidence = await listEvidenceRows(householdId)

  const state: SetupState = {
    hasHousehold: Boolean(household),
    activeChildCount: profiles.filter((p) => p.isActive !== false).length,
    activeSubjectCount: subjects.filter((s) => s.isActive !== false).length,
    hasLessons: lessons.length > 0,
    hasAttendance: attendance.length > 0,
    hasPortfolio: evidence.length > 0,
  }

  return {
    nextStep: getNextSetupStep(state),
    completed: getCompletedSteps(state),
  }
}

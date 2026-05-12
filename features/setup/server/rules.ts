import type { SetupStep } from '../types'

export interface SetupState {
  hasHousehold: boolean
  activeChildCount: number
  activeSubjectCount: number
  hasLessons: boolean
  hasAttendance: boolean
  hasPortfolio: boolean
}

const ORDER: SetupStep[] = [
  'household',
  'firstChild',
  'firstSubject',
  'firstLesson',
  'firstAttendance',
  'firstPortfolio',
]

export function getNextSetupStep(state: SetupState): SetupStep | null {
  if (!state.hasHousehold) return 'household'
  if (state.activeChildCount === 0) return 'firstChild'
  if (state.activeSubjectCount === 0) return 'firstSubject'
  if (!state.hasLessons) return 'firstLesson'
  if (!state.hasAttendance) return 'firstAttendance'
  if (!state.hasPortfolio) return 'firstPortfolio'
  return null
}

export function getCompletedSteps(state: SetupState): SetupStep[] {
  const next = getNextSetupStep(state)
  const idx = next === null ? ORDER.length : ORDER.indexOf(next)
  return ORDER.slice(0, idx)
}

export type SetupStep =
  | 'household'
  | 'firstChild'
  | 'firstSubject'
  | 'firstLesson'
  | 'firstAttendance'
  | 'firstPortfolio'

export interface SetupStatus {
  nextStep: SetupStep | null
  completed: SetupStep[]
}

import { getNextSetupStep, getCompletedSteps, type SetupState } from '@/features/setup/server/rules'

describe('getNextSetupStep', () => {
  const base: SetupState = {
    hasHousehold: true,
    activeChildCount: 1,
    activeSubjectCount: 1,
    hasLessons: true,
    hasAttendance: true,
    hasPortfolio: true,
  }

  it('returns "household" when no household exists', () => {
    expect(getNextSetupStep({ ...base, hasHousehold: false })).toBe('household')
  })

  it('returns "firstChild" when household exists but no children', () => {
    expect(getNextSetupStep({ ...base, activeChildCount: 0 })).toBe('firstChild')
  })

  it('returns "firstSubject" when household + child exist but no subjects', () => {
    expect(
      getNextSetupStep({ ...base, activeChildCount: 1, activeSubjectCount: 0 })
    ).toBe('firstSubject')
  })

  it('returns "firstLesson" when household + child + subject exist but no lessons', () => {
    expect(
      getNextSetupStep({
        ...base,
        activeChildCount: 1,
        activeSubjectCount: 1,
        hasLessons: false,
      })
    ).toBe('firstLesson')
  })

  it('returns "firstAttendance" when prior steps done but no attendance', () => {
    expect(
      getNextSetupStep({
        ...base,
        hasLessons: true,
        hasAttendance: false,
      })
    ).toBe('firstAttendance')
  })

  it('returns "firstPortfolio" when all prior steps done but no portfolio', () => {
    expect(
      getNextSetupStep({
        ...base,
        hasLessons: true,
        hasAttendance: true,
        hasPortfolio: false,
      })
    ).toBe('firstPortfolio')
  })

  it('returns null when all steps are complete', () => {
    expect(getNextSetupStep(base)).toBeNull()
  })
})

describe('getCompletedSteps', () => {
  it('completed array lists all done steps before next', () => {
    const state: SetupState = {
      hasHousehold: true,
      activeChildCount: 1,
      activeSubjectCount: 0,
      hasLessons: false,
      hasAttendance: false,
      hasPortfolio: false,
    }
    expect(getNextSetupStep(state)).toBe('firstSubject')
    expect(getCompletedSteps(state)).toEqual(['household', 'firstChild'])
  })

  it('returns full pipeline when nextStep is null', () => {
    const state: SetupState = {
      hasHousehold: true,
      activeChildCount: 1,
      activeSubjectCount: 1,
      hasLessons: true,
      hasAttendance: true,
      hasPortfolio: true,
    }
    expect(getCompletedSteps(state)).toEqual([
      'household',
      'firstChild',
      'firstSubject',
      'firstLesson',
      'firstAttendance',
      'firstPortfolio',
    ])
  })
})

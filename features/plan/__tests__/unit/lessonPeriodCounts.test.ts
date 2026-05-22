/** @jest-environment node */

import { SEED_IDS } from '@/features/lib/seedIds'
import {
  createLessonTask,
  getLessonTaskPeriodCounts,
  resetStore as resetLessons,
} from '@/features/plan/server/service'
import { resetStore as resetChildren } from '@/features/children/server/service'
import { resetStore as resetSubjects } from '@/features/subjects/server/service'
import {
  createHouseholdProfile,
  createWorkspace,
  resetStore as resetHousehold,
} from '@/features/household/server/service'
import { createStudentProfile } from '@/features/children/server/service'
import { createSubject } from '@/features/subjects/server/service'

const HOUSEHOLD = SEED_IDS.household
const PERIOD_START = '2026-05-10'
const PERIOD_END = '2026-05-16'
const SUBJECT = 'subject_seed_001'

beforeEach(() => {
  resetLessons([])
  resetChildren()
  resetSubjects()
  resetHousehold()
})

describe('getLessonTaskPeriodCounts', () => {
  it('returns lessonTasksInPeriod and lessonsCompletedInPeriod for household learners', async () => {
    createLessonTask({
      childId: SEED_IDS.layth,
      subjectId: SUBJECT,
      householdId: HOUSEHOLD,
      title: 'In period completed',
      dueDate: '2026-05-12',
      status: 'completed',
      order: 1,
    })
    createLessonTask({
      childId: SEED_IDS.layth,
      subjectId: SUBJECT,
      householdId: HOUSEHOLD,
      title: 'In period not started',
      dueDate: '2026-05-14',
      status: 'not_started',
      order: 2,
    })
    createLessonTask({
      childId: SEED_IDS.layth,
      subjectId: SUBJECT,
      householdId: HOUSEHOLD,
      title: 'Outside period',
      dueDate: '2026-05-20',
      status: 'completed',
      order: 3,
    })
    createLessonTask({
      childId: SEED_IDS.layth,
      subjectId: SUBJECT,
      householdId: HOUSEHOLD,
      title: 'Skipped in period',
      dueDate: '2026-05-11',
      status: 'skipped',
      order: 4,
    })

    const result = await getLessonTaskPeriodCounts(HOUSEHOLD, PERIOD_START, PERIOD_END)

    expect(result).toEqual({
      lessonTasksInPeriod: 3,
      lessonsCompletedInPeriod: 1,
    })
  })

  it('returns zeros when no lessons fall in the period', async () => {
    createLessonTask({
      childId: SEED_IDS.layth,
      subjectId: SUBJECT,
      householdId: HOUSEHOLD,
      title: 'Before period',
      dueDate: '2026-05-01',
      status: 'completed',
      order: 1,
    })

    const result = await getLessonTaskPeriodCounts(HOUSEHOLD, PERIOD_START, PERIOD_END)

    expect(result).toEqual({
      lessonTasksInPeriod: 0,
      lessonsCompletedInPeriod: 0,
    })
  })

  it('includes lessons on periodStart and periodEnd boundaries', async () => {
    createLessonTask({
      childId: SEED_IDS.hawa,
      subjectId: 'subject_seed_007',
      householdId: HOUSEHOLD,
      title: 'Start boundary',
      dueDate: PERIOD_START,
      status: 'completed',
      order: 1,
    })
    createLessonTask({
      childId: SEED_IDS.hawa,
      subjectId: 'subject_seed_007',
      householdId: HOUSEHOLD,
      title: 'End boundary',
      dueDate: PERIOD_END,
      status: 'not_started',
      order: 2,
    })

    const result = await getLessonTaskPeriodCounts(HOUSEHOLD, PERIOD_START, PERIOD_END)

    expect(result).toEqual({
      lessonTasksInPeriod: 2,
      lessonsCompletedInPeriod: 1,
    })
  })

  it('excludes lessons for learners outside the household', async () => {
    const ws = createWorkspace('Other Academy')
    const otherHousehold = createHouseholdProfile(ws.id, 'Other Family')
    const otherChild = createStudentProfile({
      householdId: otherHousehold.id,
      name: 'Other Child',
      gradeLabel: '1st',
      username: 'otherchild',
      password: 'pass',
    })
    const otherSubject = createSubject({
      childId: otherChild.id,
      name: 'Math',
      category: 'Math',
    })

    createLessonTask({
      childId: SEED_IDS.layth,
      subjectId: SUBJECT,
      householdId: HOUSEHOLD,
      title: 'Seed household lesson',
      dueDate: '2026-05-12',
      status: 'completed',
      order: 1,
    })
    createLessonTask({
      childId: otherChild.id,
      subjectId: otherSubject.id,
      householdId: otherHousehold.id,
      title: 'Other household lesson',
      dueDate: '2026-05-12',
      status: 'completed',
      order: 1,
    })

    const result = await getLessonTaskPeriodCounts(HOUSEHOLD, PERIOD_START, PERIOD_END)

    expect(result).toEqual({
      lessonTasksInPeriod: 1,
      lessonsCompletedInPeriod: 1,
    })
  })
})

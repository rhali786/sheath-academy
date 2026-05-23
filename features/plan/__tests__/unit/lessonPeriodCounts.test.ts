/** @jest-environment node */

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))

import { listLessonTaskRows } from '@/features/plan/server/repository'
import { getLessonTaskPeriodCounts } from '@/features/plan/server/service'

const mockListRows = listLessonTaskRows as jest.Mock
const HOUSEHOLD = 'household_test'
const PERIOD_START = '2026-05-10'
const PERIOD_END = '2026-05-16'

function makeRow(id: string, dueDate: string, status: string) {
  return { id, householdId: HOUSEHOLD, learnerId: 'learner_a', subjectId: null, title: 'Task', dueDate, status, sortOrder: 0, createdAt: new Date(), updatedAt: new Date(), description: null, notes: null, completedAt: null, skippedAt: null }
}

beforeEach(() => { mockListRows.mockReset() })

describe('getLessonTaskPeriodCounts', () => {
  it('returns lessonTasksInPeriod and lessonsCompletedInPeriod', async () => {
    mockListRows.mockResolvedValue([
      makeRow('t1', '2026-05-12', 'completed'),
      makeRow('t2', '2026-05-14', 'not_started'),
    ])
    const result = await getLessonTaskPeriodCounts(HOUSEHOLD, PERIOD_START, PERIOD_END)
    expect(result).toEqual({ lessonTasksInPeriod: 2, lessonsCompletedInPeriod: 1 })
  })

  it('returns zeros when repository returns empty', async () => {
    mockListRows.mockResolvedValue([])
    const result = await getLessonTaskPeriodCounts(HOUSEHOLD, PERIOD_START, PERIOD_END)
    expect(result).toEqual({ lessonTasksInPeriod: 0, lessonsCompletedInPeriod: 0 })
  })

  it('calls repository with correct householdId and date range', async () => {
    mockListRows.mockResolvedValue([])
    await getLessonTaskPeriodCounts(HOUSEHOLD, PERIOD_START, PERIOD_END)
    expect(mockListRows).toHaveBeenCalledWith(HOUSEHOLD, { startDate: PERIOD_START, endDate: PERIOD_END })
  })
})

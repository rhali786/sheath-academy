/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))

jest.mock('@/features/subjects/server/repository', () => ({
  listSubjectRows: jest.fn(),
}))

import { handleScheduleToday } from '@/features/schedule/api/routes/schedule'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listSubjectRows } from '@/features/subjects/server/repository'
import type { DaySchedule } from '@/features/schedule/types'

const mockList = listLessonTaskRows as jest.Mock
const mockSubjects = listSubjectRows as jest.Mock

const ALL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function row(id: string, subjectId: string, overrides: Record<string, unknown> = {}) {
  return {
    id, householdId: 'hh_test', learnerId: 'l1', subjectId, title: id, dueDate: '2026-10-13',
    status: 'not_started', sortOrder: 0, estimatedDuration: '30min', scheduledStartTime: null, scheduledEndTime: null,
    plannedStartDate: null, createdAt: new Date(), updatedAt: new Date(), ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  // A block on every weekday so the test does not depend on what day it runs.
  mockSubjects.mockResolvedValue([
    { id: 'math', recurringSchedule: [{ daysOfWeek: ALL_DAYS, startTime: '10:15', endTime: '11:00' }] },
  ])
})

async function today(): Promise<DaySchedule> {
  const res = await handleScheduleToday(new Request('http://localhost/api/schedule/today'))
  return (await res.json()).data
}

describe('GET /api/schedule/today', () => {
  it("places an untimed lesson at its course's recurring time", async () => {
    mockList.mockResolvedValue([row('m1', 'math')])
    const schedule = await today()
    expect(mockSubjects).toHaveBeenCalledWith('hh_test')
    expect(schedule.blocks[0]).toMatchObject({ startTime: '10:15', endTime: '11:00', flexibilityState: 'locked' })
  })

  it("keeps a lesson's own scheduled time over the course time", async () => {
    mockList.mockResolvedValue([row('m1', 'math', { scheduledStartTime: '13:00', scheduledEndTime: '13:30' })])
    const schedule = await today()
    expect(schedule.blocks[0]).toMatchObject({ startTime: '13:00', endTime: '13:30' })
  })
})

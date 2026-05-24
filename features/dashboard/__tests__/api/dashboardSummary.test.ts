/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_01', userId: 'user_01', timezone: 'America/New_York' })
})

jest.mock('@/features/attendance/server/repository', () => ({
  listAttendanceEvents: jest.fn(),
}))
jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))
jest.mock('@/features/quran/server/repository', () => ({
  listQuranSessionRows: jest.fn(),
}))
jest.mock('@/features/portfolio/server/repository', () => ({
  listEvidenceRows: jest.fn(),
}))
jest.mock('@/features/children/server/repository', () => ({
  listLearners: jest.fn(),
}))
jest.mock('@/features/alerts/server/service', () => ({
  getAlerts: jest.fn(),
}))

import { GET } from '@/features/dashboard/api/routes/summary'
import { listAttendanceEvents } from '@/features/attendance/server/repository'
import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listQuranSessionRows } from '@/features/quran/server/repository'
import { listEvidenceRows } from '@/features/portfolio/server/repository'
import { listLearners } from '@/features/children/server/repository'
import { getAlerts } from '@/features/alerts/server/service'
import { toDateString } from '@/features/lib/server/date'

const mockListAttendanceEvents = listAttendanceEvents as jest.Mock
const mockListLessonTaskRows = listLessonTaskRows as jest.Mock
const mockListQuranSessionRows = listQuranSessionRows as jest.Mock
const mockListEvidenceRows = listEvidenceRows as jest.Mock
const mockGetAlerts = getAlerts as jest.Mock
const mockListLearners = listLearners as jest.Mock

function makeRequest(url = 'http://localhost/api/dashboard/summary') {
  return new Request(url)
}

const today = toDateString(new Date(), 'America/New_York')

beforeEach(() => {
  mockListLearners.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])
  mockListAttendanceEvents.mockResolvedValue([{ status: 'present', learnerId: 'c1' }])
  mockListLessonTaskRows.mockResolvedValue([])
  mockListQuranSessionRows.mockResolvedValue([])
  mockListEvidenceRows.mockResolvedValue([])
  mockGetAlerts.mockResolvedValue([])
})

describe('GET /api/dashboard/summary', () => {
  test('returns task summary counts', async () => {
    mockListLessonTaskRows
      .mockResolvedValueOnce([
        {
          id: 'l1',
          learnerId: 'c1',
          subjectId: 's1',
          householdId: 'hh_01',
          title: 'Math',
          dueDate: today,
          status: 'completed',
          sortOrder: 1,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
      .mockResolvedValueOnce([])

    const res = await GET(makeRequest())
    const json = await res.json()

    expect(json.status).toBe('success')
    expect(json.data.tasksCompleted).toBeGreaterThanOrEqual(1)
    expect(json.data).toMatchObject({
      tasksInProgress: expect.any(Number),
      tasksOverdue: expect.any(Number),
    })
  })

  test('scopes metrics to childId query param', async () => {
    await GET(makeRequest('http://localhost/api/dashboard/summary?childId=c1'))

    expect(mockListLessonTaskRows).toHaveBeenCalledWith(
      'hh_01',
      expect.objectContaining({ learnerId: 'c1' }),
    )
  })
})

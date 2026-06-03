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

const mockListAttendanceEvents = listAttendanceEvents as jest.Mock
const mockListLessonTaskRows = listLessonTaskRows as jest.Mock
const mockListQuranSessionRows = listQuranSessionRows as jest.Mock
const mockListEvidenceRows = listEvidenceRows as jest.Mock
const mockListLearners = listLearners as jest.Mock
const mockGetAlerts = getAlerts as jest.Mock

function makeRequest(url = 'http://localhost/api/dashboard/summary') {
  return new Request(url)
}

beforeEach(() => {
  mockListLearners.mockResolvedValue([{ id: 'c1' }, { id: 'c2' }])
  mockListAttendanceEvents.mockResolvedValue([{ status: 'present', learnerId: 'c1' }])
  mockListLessonTaskRows.mockResolvedValue([{ id: 'l1' }])
  mockListQuranSessionRows.mockResolvedValue([{ id: 'q1' }])
  mockListEvidenceRows.mockResolvedValue([{ id: 'e1' }, { id: 'e2' }])
  mockGetAlerts.mockResolvedValue([])
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/dashboard/summary', () => {
  test('returns correct metrics from all data sources', async () => {
    const res = await GET(makeRequest())
    const body = await res.json()

    expect(body.status).toBe('success')
    expect(body.data.attendanceReady).toBe('1/2')
    expect(body.data.lessonsPlanned).toBe(1)
    expect(body.data.quranLogged).toMatch(/1 session/)
    expect(body.data.portfolioItems).toBe(2)
    expect(body.data.needsAttention).toBe(0)
  })

  test('all repository calls are made for each request, including overdue lesson lookup', async () => {
    await GET(makeRequest())

    expect(mockListLearners).toHaveBeenCalledTimes(1)
    expect(mockListAttendanceEvents).toHaveBeenCalledTimes(1)
    expect(mockListLessonTaskRows).toHaveBeenCalledTimes(2)
    expect(mockListQuranSessionRows).toHaveBeenCalledTimes(1)
    expect(mockListEvidenceRows).toHaveBeenCalledTimes(1)
    expect(mockGetAlerts).toHaveBeenCalledTimes(1)
  })

  test('all repository calls fire in parallel — none blocks after a slow first call', async () => {
    const callOrder: string[] = []
    // Make listLearners slow; if others wait for it, their callOrder entries will appear after
    mockListLearners.mockImplementation(() =>
      new Promise(resolve => setTimeout(() => { callOrder.push('learners'); resolve([]) }, 50))
    )
    mockListAttendanceEvents.mockImplementation(async () => { callOrder.push('attendance'); return [] })
    mockListLessonTaskRows.mockImplementation(async () => { callOrder.push('lessons'); return [] })
    mockListQuranSessionRows.mockImplementation(async () => { callOrder.push('quran'); return [] })
    mockListEvidenceRows.mockImplementation(async () => { callOrder.push('evidence'); return [] })
    mockGetAlerts.mockImplementation(async () => { callOrder.push('alerts'); return [] })

    await GET(makeRequest())

    // All fast calls must complete before the slow learners call
    expect(callOrder.indexOf('learners')).toBeGreaterThan(callOrder.indexOf('attendance'))
    expect(callOrder.indexOf('learners')).toBeGreaterThan(callOrder.indexOf('lessons'))
  })

  test('filters by childId when provided', async () => {
    mockListLearners.mockResolvedValue([{ id: 'c1' }])
    await GET(makeRequest('http://localhost/api/dashboard/summary?childId=c1'))

    expect(mockListAttendanceEvents).toHaveBeenCalledWith('hh_01', expect.objectContaining({ learnerId: 'c1' }))
    expect(mockListLessonTaskRows).toHaveBeenCalledWith('hh_01', expect.objectContaining({ learnerId: 'c1' }))
    expect(mockGetAlerts).toHaveBeenCalledWith('hh_01', 'c1')
  })

  test('returns error shape on repository failure', async () => {
    mockListLearners.mockRejectedValue(new Error('db down'))
    const res = await GET(makeRequest())
    expect(res.status).toBe(500)
    const body = await res.json()
    expect(body.status).toBe('error')
  })
})

/** @jest-environment node */

jest.mock('@/features/lib/server/tenant', () => ({
  getHouseholdContext: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' }),
}))

jest.mock('@/features/attendance/server/repository', () => ({
  listAttendanceEvents: jest.fn(),
}))

import { GET } from '@/features/attendance/api/routes/summary'
import { listAttendanceEvents } from '@/features/attendance/server/repository'

const mockList = listAttendanceEvents as jest.Mock

describe('GET /api/attendance/summary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns 400 when childId is missing', async () => {
    const res = await GET(new Request('http://localhost/api/attendance/summary'))
    expect(res.status).toBe(400)
  })

  it('returns status counts for the learner', async () => {
    mockList.mockResolvedValue([
      { status: 'present' },
      { status: 'present' },
      { status: 'excused' },
    ])

    const res = await GET(new Request('http://localhost/api/attendance/summary?childId=learner_1'))
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body.status).toBe('success')
    expect(body.data.childId).toBe('learner_1')
    expect(body.data.totalRecorded).toBe(3)
    expect(body.data.byStatus.present).toBe(2)
    expect(body.data.byStatus.excused).toBe(1)
    expect(mockList).toHaveBeenCalledWith('hh_test', { learnerId: 'learner_1', startDate: undefined, endDate: undefined })
  })

  it('passes optional date range filters', async () => {
    mockList.mockResolvedValue([])
    await GET(new Request('http://localhost/api/attendance/summary?childId=learner_1&startDate=2026-01-01&endDate=2026-01-31'))
    expect(mockList).toHaveBeenCalledWith('hh_test', {
      learnerId: 'learner_1',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    })
  })
})

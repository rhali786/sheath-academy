/** @jest-environment node */

import { GET } from '@/features/alerts/api/routes/alerts'

jest.mock('@/features/alerts/server/service', () => ({
  getAlerts: jest.fn(),
}))

jest.mock('@/features/lib/server/tenant', () => ({
  getHouseholdContext: jest.fn(),
}))

import { getAlerts } from '@/features/alerts/server/service'
import { getHouseholdContext } from '@/features/lib/server/tenant'
const mockGetAlerts = getAlerts as jest.Mock
const mockGetHouseholdContext = getHouseholdContext as jest.Mock

const HOUSEHOLD_ID = 'hh_01'
const TODAY = '2026-05-17'
const YESTERDAY = '2026-05-16'

const alert1 = {
  id: 'pending_lessons_adam',
  childId: 'adam_01',
  date: YESTERDAY,
  type: 'pending_lessons',
  status: 'open',
  severity: 'high',
  title: '2 lessons not completed',
  message: '1 overdue: Fractions',
  sourceFeature: 'planner',
  createdAt: `${YESTERDAY}T10:00:00Z`,
}
const alert2 = {
  id: `attendance_missing_${TODAY}`,
  childId: null,
  date: TODAY,
  type: 'attendance_missing',
  status: 'open',
  severity: 'medium',
  title: 'Attendance not logged today',
  message: 'Missing for: Khadijah',
  sourceFeature: 'attendance',
  createdAt: `${TODAY}T08:00:00Z`,
}
const alert3 = {
  id: 'pending_lessons_khadijah',
  childId: 'khadijah_01',
  date: TODAY,
  type: 'pending_lessons',
  status: 'dismissed',
  severity: 'medium',
  title: '1 lesson not completed',
  message: 'Due today: Reading',
  sourceFeature: 'planner',
  createdAt: `${TODAY}T07:00:00Z`,
}

function createRequest(url: string): Request {
  return new Request(`http://localhost${url}`)
}

beforeEach(() => {
  mockGetHouseholdContext.mockResolvedValue({ householdId: HOUSEHOLD_ID, userId: 'user_01', timezone: 'America/New_York' })
  mockGetAlerts.mockResolvedValue([alert1, alert2, alert3])
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('GET /api/alerts', () => {
  test('returns all alerts when no childId filter', async () => {
    const res = await GET(createRequest('/api/alerts'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(3)
    expect(mockGetAlerts).toHaveBeenCalledWith(HOUSEHOLD_ID, undefined)
  })

  test('filters alerts by childId', async () => {
    mockGetAlerts.mockImplementation(async (_householdId: string, childId?: string) =>
      childId === 'adam_01'
        ? [alert1]
        : [alert1, alert2, alert3]
    )
    const res = await GET(createRequest('/api/alerts?childId=adam_01'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.every((a: { childId: string | null }) => a.childId === 'adam_01' || a.childId === null)).toBe(true)
    expect(mockGetAlerts).toHaveBeenCalledWith(HOUSEHOLD_ID, 'adam_01')
  })

  test('returns empty array when no alerts', async () => {
    mockGetAlerts.mockResolvedValue([])
    const res = await GET(createRequest('/api/alerts'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(0)
  })

  test('filters by status=open returns only open alerts', async () => {
    const res = await GET(createRequest('/api/alerts?status=open'))
    const body = await res.json()
    expect(body.status).toBe('success')
    // alert3 has status=dismissed, so only alert1 and alert2 should be returned
    expect(body.data).toHaveLength(2)
    expect(body.data.every((a: { status: string }) => a.status === 'open')).toBe(true)
  })

  test('filters by type=pending_lessons returns only matching type', async () => {
    const res = await GET(createRequest('/api/alerts?type=pending_lessons'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(2)
    expect(body.data.every((a: { type: string }) => a.type === 'pending_lessons')).toBe(true)
  })

  test('filters by startDate and endDate returns alerts in range', async () => {
    // alert1 has date=YESTERDAY, alert2 date=TODAY, alert3 date=TODAY
    const res = await GET(createRequest(`/api/alerts?startDate=${TODAY}&endDate=${TODAY}`))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(2)
    expect(body.data.every((a: { date?: string }) => a.date === TODAY)).toBe(true)
  })

  test('filters by startDate only returns alerts from that date onward', async () => {
    const res = await GET(createRequest(`/api/alerts?startDate=${TODAY}`))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(2)
  })

  test('combines status and type filters', async () => {
    const res = await GET(createRequest('/api/alerts?status=open&type=pending_lessons'))
    const body = await res.json()
    expect(body.status).toBe('success')
    // alert1 is open+pending_lessons, alert2 is open+attendance_missing, alert3 is dismissed+pending_lessons
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('pending_lessons_adam')
  })
})

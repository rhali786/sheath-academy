/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_01', userId: 'user_01', timezone: 'America/New_York' })
})

jest.mock('@/features/alerts/server/service', () => ({
  getAlerts: jest.fn(),
}))

jest.mock('@/features/children/server/repository', () => ({ listAllLearners: jest.fn() }))
jest.mock('@/features/plan/server/repository', () => ({ listLessonTaskRows: jest.fn() }))
jest.mock('@/features/attendance/server/repository', () => ({ listAttendanceEvents: jest.fn() }))

import { GET } from '@/features/alerts/api/routes/alerts'
import { getAlerts } from '@/features/alerts/server/service'

const mockGetAlerts = getAlerts as jest.Mock

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
  mockGetAlerts.mockResolvedValue([alert1, alert2, alert3])
})

afterEach(() => {
  jest.clearAllMocks()
})

/**
 * Reproduction for feedback 9937be68: the "Attendance not logged today" alert
 * never clears after logging attendance when the server PROCESS timezone differs
 * from the HOUSEHOLD timezone (e.g. the prod server runs in UTC, the family is in
 * a different zone).
 *
 * AttendancePage (features/attendance/front/pages/AttendancePage.tsx:24-26, 89-107)
 * submits attendanceDate as the *household-local* date. getAlerts must compute
 * "today" in the *household* timezone too — not the server process tz — or the
 * attendance_missing query filters on a different calendar day and the just-saved
 * record is never matched, so the alert never clears.
 *
 * This block exercises the REAL getAlerts service (not the file-wide mock above)
 * with the repositories mocked at the boundary. It overrides the household tz to
 * Pacific/Kiritimati (UTC+14) and pins the clock to 12:00Z — an instant that is
 * 2026-06-12 in the household tz but 2026-06-11 in every runner tz from UTC-11
 * to UTC+13. That guarantees divergence from the server-process date regardless
 * of where CI runs (no reliance on mutating process.env.TZ mid-run).
 */
describe('getAlerts — attendance_missing clears across a household-vs-server day boundary', () => {
  const actualService = jest.requireActual('@/features/alerts/server/service') as typeof import('@/features/alerts/server/service')

  // 2026-06-11T12:00:00Z is 2026-06-12 02:00 in Pacific/Kiritimati (UTC+14),
  // but still 2026-06-11 in any plausible CI/server tz.
  const INSTANT = new Date('2026-06-11T12:00:00.000Z')
  const HOUSEHOLD_TZ = 'Pacific/Kiritimati'
  const HOUSEHOLD_TODAY = '2026-06-12' // what AttendancePage submits in the household tz
  const SERVER_TODAY = '2026-06-11' // what a naive server-process-local todayLocal() returns

  const learner = {
    id: 'adam_01',
    householdId: HOUSEHOLD_ID,
    name: 'Adam',
    displayColor: null,
    gradeLevel: 'Grade 5',
    isActive: true,
    archivedAt: null,
    sortOrder: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  }

  let listAllLearners: jest.Mock
  let listLessonTaskRows: jest.Mock
  let listAttendanceEvents: jest.Mock
  let tryGetRequestAuthCtx: jest.Mock

  beforeEach(() => {
    jest.useFakeTimers()
    jest.setSystemTime(INSTANT)

    listAllLearners = require('@/features/children/server/repository').listAllLearners
    listLessonTaskRows = require('@/features/plan/server/repository').listLessonTaskRows
    listAttendanceEvents = require('@/features/attendance/server/repository').listAttendanceEvents
    tryGetRequestAuthCtx = require('@/features/auth/server/requestAuth').tryGetRequestAuthCtx

    tryGetRequestAuthCtx.mockReturnValue({ householdId: HOUSEHOLD_ID, userId: 'user_01', timezone: HOUSEHOLD_TZ })
    listAllLearners.mockResolvedValue([learner])
    listLessonTaskRows.mockResolvedValue([])
    listAttendanceEvents.mockResolvedValue([])
  })

  afterEach(() => {
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  test('queries attendance for the household-local date, not the server-process date', async () => {
    await actualService.getAlerts(HOUSEHOLD_ID)
    expect(listAttendanceEvents).toHaveBeenCalledWith(HOUSEHOLD_ID, { date: HOUSEHOLD_TODAY })
    expect(listAttendanceEvents).not.toHaveBeenCalledWith(HOUSEHOLD_ID, { date: SERVER_TODAY })
  })

  test('no attendance_missing alert remains after attendance is logged for the household-local today', async () => {
    // Attendance saved exactly the way AttendancePage saves it: for the household "today".
    listAttendanceEvents.mockResolvedValue([
      {
        id: 'att_1',
        householdId: HOUSEHOLD_ID,
        learnerId: learner.id,
        attendanceDate: HOUSEHOLD_TODAY,
        status: 'present',
        minutes: null,
        notes: null,
        occurredAt: INSTANT,
        voidedAt: null,
        createdAt: INSTANT,
        updatedAt: INSTANT,
      },
    ])

    const alerts = await actualService.getAlerts(HOUSEHOLD_ID)
    expect(alerts.filter(a => a.type === 'attendance_missing')).toHaveLength(0)
  })
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
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('pending_lessons_adam')
  })
})

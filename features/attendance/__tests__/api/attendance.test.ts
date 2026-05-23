/** @jest-environment node */

jest.mock('@/features/lib/server/tenant', () => ({
  getHouseholdContext: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' }),
}))

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
  sessionAuthCtx: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test' }),
}))

jest.mock('@/features/attendance/server/repository', () => ({
  listAttendanceEvents: jest.fn(),
  createAttendanceEvent: jest.fn(),
}))

jest.mock('@/features/admin-metrics/server/instrument', () => ({
  trackAttendanceLogged: jest.fn(),
}))

import { listAttendanceEvents, createAttendanceEvent } from '@/features/attendance/server/repository'
import { GET, POST } from '@/features/attendance/api/routes/attendance'

const mockList = listAttendanceEvents as jest.Mock
const mockCreate = createAttendanceEvent as jest.Mock

function makeRow(id = 'att_1', status = 'present') {
  return { id, householdId: 'hh_test', learnerId: 'learner_1', attendanceDate: '2026-05-17', status, minutes: null, notes: null, voidedAt: null, occurredAt: new Date(), createdAt: new Date(), updatedAt: new Date() }
}

beforeEach(() => { mockList.mockReset(); mockCreate.mockReset() })

describe('GET /api/attendance', () => {
  it('returns empty array when no records', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/attendance'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns mapped records from repository', async () => {
    mockList.mockResolvedValue([makeRow()])
    const res = await GET(new Request('http://localhost/api/attendance'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
    expect(body.data[0].id).toBe('att_1')
  })
})

describe('POST /api/attendance', () => {
  it('returns 400 when required fields missing', async () => {
    const req = new Request('http://localhost/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
    const res = await POST(req)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(res.status).toBe(400)
  })

  it('returns 400 for invalid status', async () => {
    const req = new Request('http://localhost/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: 'l1', date: '2026-05-17', status: 'invalid_status' }) })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('creates and returns a record on valid input', async () => {
    mockCreate.mockResolvedValue(makeRow('att_new'))
    const req = new Request('http://localhost/api/attendance', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: 'learner_1', date: '2026-05-17', status: 'present' }) })
    const res = await POST(req)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.id).toBe('att_new')
  })
})

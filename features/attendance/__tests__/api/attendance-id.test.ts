/** @jest-environment node */

jest.mock('@/features/lib/server/tenant', () => ({
  getHouseholdContext: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' }),
}))

jest.mock('@/features/attendance/server/repository', () => ({
  getAttendanceEvent: jest.fn(),
  updateAttendanceEvent: jest.fn(),
  voidAttendanceEvent: jest.fn(),
}))

import { getAttendanceEvent, updateAttendanceEvent, voidAttendanceEvent } from '@/features/attendance/server/repository'
import { GET, PATCH, DELETE } from '@/features/attendance/api/routes/attendance-id'

const mockGet = getAttendanceEvent as jest.Mock
const mockUpdate = updateAttendanceEvent as jest.Mock
const mockVoid = voidAttendanceEvent as jest.Mock

function makeRow(id = 'att_1') {
  return { id, householdId: 'hh_test', learnerId: 'l1', attendanceDate: '2026-05-17', status: 'present', minutes: null, notes: null, voidedAt: null, occurredAt: new Date(), createdAt: new Date(), updatedAt: new Date() }
}

beforeEach(() => { mockGet.mockReset(); mockUpdate.mockReset(); mockVoid.mockReset() })

describe('GET /api/attendance/:id', () => {
  it('returns 404 when not found', async () => {
    mockGet.mockResolvedValue(null)
    const res = await GET('att_missing')
    expect(res.status).toBe(404)
  })

  it('returns the record when found', async () => {
    mockGet.mockResolvedValue(makeRow())
    const res = await GET('att_1')
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.id).toBe('att_1')
  })
})

describe('PATCH /api/attendance/:id', () => {
  it('returns 404 when not found', async () => {
    mockUpdate.mockResolvedValue(null)
    const req = new Request('http://localhost', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'absent' }) })
    const res = await PATCH('att_x', req)
    expect(res.status).toBe(404)
  })

  it('returns updated record', async () => {
    mockUpdate.mockResolvedValue({ ...makeRow(), status: 'absent' })
    const req = new Request('http://localhost', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'absent' }) })
    const res = await PATCH('att_1', req)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.status).toBe('absent')
  })
})

describe('DELETE /api/attendance/:id', () => {
  it('returns 404 when not found', async () => {
    mockVoid.mockResolvedValue(null)
    const res = await DELETE('att_x')
    expect(res.status).toBe(404)
  })

  it('returns success when voided', async () => {
    mockVoid.mockResolvedValue(makeRow())
    const res = await DELETE('att_1')
    const body = await res.json()
    expect(body.status).toBe('success')
  })
})

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
  createAttendanceEvent: jest.fn(),
}))

import { createAttendanceEvent } from '@/features/attendance/server/repository'
import { BATCH } from '@/features/attendance/api/routes/attendance'

const mockCreate = createAttendanceEvent as jest.Mock

beforeEach(() => { mockCreate.mockReset() })

function makeBatchRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/attendance', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('BATCH attendance', () => {
  it('returns 400 when entries is not an array', async () => {
    const res = await BATCH(makeBatchRequest({ date: '2026-05-17' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when date is missing', async () => {
    const res = await BATCH(makeBatchRequest({ entries: [{ childId: 'l1', status: 'present' }] }))
    expect(res.status).toBe(400)
  })

  it('creates attendance for valid entries', async () => {
    mockCreate.mockResolvedValue({ id: 'att_1', householdId: 'hh_test', learnerId: 'l1', attendanceDate: '2026-05-17', status: 'present', minutes: null, notes: null, voidedAt: null, occurredAt: new Date(), createdAt: new Date(), updatedAt: new Date() })
    const res = await BATCH(makeBatchRequest({ date: '2026-05-17', entries: [{ childId: 'l1', status: 'present' }] }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(1)
  })

  it('skips entries with invalid status', async () => {
    const res = await BATCH(makeBatchRequest({ date: '2026-05-17', entries: [{ childId: 'l1', status: 'invalid' }] }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(0)
  })
})

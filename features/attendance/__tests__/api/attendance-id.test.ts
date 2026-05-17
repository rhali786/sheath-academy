/** @jest-environment node */

import { GET, PATCH, DELETE } from '@/features/attendance/api/routes/attendance-id'
import { resetStore } from '@/features/attendance/server/service'
import { SEED_IDS } from '@/features/lib/seedIds'

const SEED_RECORD_ID = 'attendance_seed_001'

beforeEach(() => {
  resetStore()
})

function makePatchRequest(body: Record<string, unknown>): Request {
  return new Request('http://localhost/api/attendance/x', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('GET /api/attendance/:id', () => {
  it('returns a record by id', async () => {
    const res = await GET(SEED_RECORD_ID)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.id).toBe(SEED_RECORD_ID)
    expect(body.data.childId).toBe(SEED_IDS.layth)
  })

  it('returns 404 for unknown id', async () => {
    const res = await GET('nonexistent_id')
    expect(res.status).toBe(404)
  })
})

describe('PATCH /api/attendance/:id', () => {
  it('updates status', async () => {
    const res = await PATCH(SEED_RECORD_ID, makePatchRequest({ status: 'absent' }))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.status).toBe('absent')
  })

  it('updates notes and hours', async () => {
    const res = await PATCH(SEED_RECORD_ID, makePatchRequest({ notes: 'Sick day', hours: 0, minutes: 0 }))
    const body = await res.json()
    expect(body.data.notes).toBe('Sick day')
  })

  it('returns 404 for unknown id', async () => {
    const res = await PATCH('nonexistent_id', makePatchRequest({ status: 'absent' }))
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/attendance/:id', () => {
  it('archives a record (does not hard-delete)', async () => {
    const res = await DELETE(SEED_RECORD_ID)
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.message).toMatch(/archive/i)
    // Record still accessible but marked archived
    const verify = await GET(SEED_RECORD_ID)
    const verifyBody = await verify.json()
    expect(verifyBody.data.isArchived).toBe(true)
  })

  it('returns 404 for unknown id', async () => {
    const res = await DELETE('nonexistent_id')
    expect(res.status).toBe(404)
  })
})

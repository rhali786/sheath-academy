/** @jest-environment node */

jest.mock('@/features/lib/server/tenant', () => ({
  getHouseholdContext: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' }),
}))

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
  sessionAuthCtx: jest.fn().mockResolvedValue({ householdId: 'hh_test', userId: 'user_test' }),
}))

jest.mock('@/features/quran/server/repository', () => ({
  listQuranSessionRows: jest.fn(),
  createQuranSessionRow: jest.fn(),
  updateQuranSessionRow: jest.fn(),
  deleteQuranSessionRow: jest.fn(),
}))

jest.mock('@/features/admin-metrics/server/instrument', () => ({
  trackQuranRecord: jest.fn(),
}))

import { listQuranSessionRows, createQuranSessionRow, updateQuranSessionRow, deleteQuranSessionRow } from '@/features/quran/server/repository'
import { GET, POST, PATCH, DELETE } from '@/features/quran/api/routes/sessions'

const mockList = listQuranSessionRows as jest.Mock
const mockCreate = createQuranSessionRow as jest.Mock
const mockUpdate = updateQuranSessionRow as jest.Mock
const mockDelete = deleteQuranSessionRow as jest.Mock

function makeRow(id = 'qs_1') {
  return { id, householdId: 'hh_test', learnerId: 'l1', sessionDate: '2026-05-17', sessionType: 'revision', surah: 'Al-Fatiha', fromAyah: 1, toAyah: 7, durationMinutes: 20, notes: null, createdAt: new Date(), updatedAt: new Date() }
}

beforeEach(() => { mockList.mockReset(); mockCreate.mockReset(); mockUpdate.mockReset(); mockDelete.mockReset() })

describe('GET /api/quran/sessions', () => {
  it('returns empty sessions and chartData', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/quran/sessions'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.sessions).toEqual([])
  })

  it('returns sessions from repository', async () => {
    mockList.mockResolvedValue([makeRow()])
    const res = await GET(new Request('http://localhost/api/quran/sessions'))
    const body = await res.json()
    expect(body.data.sessions).toHaveLength(1)
    expect(body.data.sessions[0].id).toBe('qs_1')
  })
})

describe('POST /api/quran/sessions', () => {
  it('creates a session', async () => {
    mockCreate.mockResolvedValue(makeRow('qs_new'))
    const req = new Request('http://localhost/api/quran/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ childId: 'l1', type: 'revision', surah: 'Al-Fatiha', fromAyah: 1, toAyah: 7 }) })
    const res = await POST(req)
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.id).toBe('qs_new')
  })
})

describe('PATCH /api/quran/sessions/:id', () => {
  it('returns 404 when not found', async () => {
    mockUpdate.mockResolvedValue(null)
    const req = new Request('http://localhost', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ surah: 'Al-Baqarah' }) })
    const res = await PATCH(req, { id: 'qs_missing' })
    expect(res.status).toBe(404)
  })
})

describe('DELETE /api/quran/sessions/:id', () => {
  it('returns 404 when not found', async () => {
    mockDelete.mockResolvedValue(null)
    const res = await DELETE(new Request('http://localhost'), { id: 'qs_missing' })
    expect(res.status).toBe(404)
  })

  it('returns success when deleted', async () => {
    mockDelete.mockResolvedValue(makeRow())
    const res = await DELETE(new Request('http://localhost'), { id: 'qs_1' })
    const body = await res.json()
    expect(body.status).toBe('success')
  })
})

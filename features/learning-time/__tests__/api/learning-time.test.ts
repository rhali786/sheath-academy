/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/learning-time/server/repository', () => ({
  getSessionRow: jest.fn(),
  getActiveSessionRow: jest.fn(),
  createSessionRow: jest.fn(),
  updateSessionRow: jest.fn(),
  listFinalizedSessionRows: jest.fn(),
}))

import {
  getSessionRow,
  getActiveSessionRow,
  createSessionRow,
  updateSessionRow,
  listFinalizedSessionRows,
} from '@/features/learning-time/server/repository'
import { POST, GET, GET_ACTIVE, PATCH } from '@/features/learning-time/api/routes/learning-time'

const mockGetSession = getSessionRow as jest.Mock
const mockGetActive = getActiveSessionRow as jest.Mock
const mockCreate = createSessionRow as jest.Mock
const mockUpdate = updateSessionRow as jest.Mock
const mockList = listFinalizedSessionRows as jest.Mock

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  const now = new Date('2026-06-12T08:00:00.000Z')
  return {
    id: 'lt_1',
    householdId: 'hh_test',
    learnerId: 'learner_1',
    subjectId: null,
    lessonTaskId: null,
    timeChannelType: 'timer',
    targetMinutes: 30,
    scheduledStart: null,
    scheduledEnd: null,
    status: 'draft',
    startedAt: null,
    pausedAt: null,
    endedAt: null,
    endedBy: null,
    outcome: null,
    notes: null,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  }
}

beforeEach(() => {
  mockGetSession.mockReset()
  mockGetActive.mockReset()
  mockCreate.mockReset()
  mockUpdate.mockReset()
  mockList.mockReset()
})

describe('POST /api/learning-time/sessions', () => {
  it('creates a draft session', async () => {
    mockGetActive.mockResolvedValue(null)
    mockCreate.mockResolvedValue(makeRow())
    const req = new Request('http://localhost/api/learning-time/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId: 'learner_1', timeChannelType: 'timer', targetMinutes: 30 }),
    })
    const res = await POST(req)
    const body = await res.json()
    expect(res.status).toBe(201)
    expect(body.status).toBe('success')
    expect(body.data.id).toBe('lt_1')
    expect(body.data.status).toBe('draft')
  })

  it('returns 400 when required fields are missing', async () => {
    const req = new Request('http://localhost/api/learning-time/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId: 'learner_1' }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })

  it('returns 400 when the learner already has an active session', async () => {
    mockGetActive.mockResolvedValue(makeRow({ id: 'lt_existing', status: 'running' }))
    mockCreate.mockRejectedValue(new Error('Learner already has an active learning time session'))
    const req = new Request('http://localhost/api/learning-time/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ learnerId: 'learner_1', timeChannelType: 'timer', targetMinutes: 30 }),
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

describe('GET /api/learning-time/sessions/active', () => {
  it('returns null when there is no active session', async () => {
    mockGetActive.mockResolvedValue(null)
    const res = await GET_ACTIVE(new Request('http://localhost/api/learning-time/sessions/active?learnerId=learner_1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toBeNull()
  })

  it('returns the active session for the learner', async () => {
    mockGetActive.mockResolvedValue(makeRow({ status: 'running', startedAt: new Date('2026-06-12T07:30:00.000Z') }))
    const res = await GET_ACTIVE(new Request('http://localhost/api/learning-time/sessions/active?learnerId=learner_1'))
    const body = await res.json()
    expect(body.data.id).toBe('lt_1')
    expect(body.data.status).toBe('running')
    expect(typeof body.data.elapsedSeconds).toBe('number')
  })

  it('returns 400 when learnerId is missing', async () => {
    const res = await GET_ACTIVE(new Request('http://localhost/api/learning-time/sessions/active'))
    expect(res.status).toBe(400)
  })
})

describe('GET /api/learning-time/sessions', () => {
  it('returns an empty list when there are no finalized sessions', async () => {
    mockList.mockResolvedValue([])
    const res = await GET(new Request('http://localhost/api/learning-time/sessions?learnerId=learner_1'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toEqual([])
  })

  it('returns finalized sessions in range', async () => {
    mockList.mockResolvedValue([
      makeRow({ status: 'finalized', endedAt: new Date('2026-06-12T08:30:00.000Z'), outcome: 'complete' }),
    ])
    const res = await GET(
      new Request('http://localhost/api/learning-time/sessions?learnerId=learner_1&from=2026-06-01&to=2026-06-30'),
    )
    const body = await res.json()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].outcome).toBe('complete')
  })
})

describe('PATCH /api/learning-time/sessions/:id', () => {
  it('starts a draft session', async () => {
    mockGetSession.mockResolvedValue(makeRow({ status: 'draft' }))
    mockUpdate.mockResolvedValue(makeRow({ status: 'running', startedAt: new Date('2026-06-12T08:00:00.000Z') }))
    const req = new Request('http://localhost/api/learning-time/sessions/lt_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe('running')
  })

  it('returns 404 when the session does not exist', async () => {
    mockGetSession.mockResolvedValue(null)
    const req = new Request('http://localhost/api/learning-time/sessions/lt_missing', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt_missing' }) })
    expect(res.status).toBe(404)
  })

  it('returns 400 for an illegal transition', async () => {
    mockGetSession.mockResolvedValue(makeRow({ status: 'draft' }))
    const req = new Request('http://localhost/api/learning-time/sessions/lt_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt_1' }) })
    expect(res.status).toBe(400)
  })

  it('returns 400 for an unknown action', async () => {
    mockGetSession.mockResolvedValue(makeRow({ status: 'draft' }))
    const req = new Request('http://localhost/api/learning-time/sessions/lt_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'bogus' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt_1' }) })
    expect(res.status).toBe(400)
  })

  it('finalizes an ended session with outcome and notes', async () => {
    mockGetSession.mockResolvedValue(makeRow({ status: 'ended', endedAt: new Date('2026-06-12T08:30:00.000Z') }))
    mockUpdate.mockResolvedValue(
      makeRow({ status: 'finalized', endedAt: new Date('2026-06-12T08:30:00.000Z'), outcome: 'complete', notes: 'Great session' }),
    )
    const req = new Request('http://localhost/api/learning-time/sessions/lt_1', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'finalize', outcome: 'complete', notes: 'Great session' }),
    })
    const res = await PATCH(req, { params: Promise.resolve({ id: 'lt_1' }) })
    const body = await res.json()
    expect(res.status).toBe(200)
    expect(body.data.status).toBe('finalized')
    expect(body.data.outcome).toBe('complete')
    expect(body.data.notes).toBe('Great session')
  })
})

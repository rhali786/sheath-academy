/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/auth/server/routeOwnership', () => ({
  guardOwnership: jest.fn((fn: () => Promise<Response>) => fn()),
  assertSessionOwnership: jest.fn().mockResolvedValue(undefined),
}))

jest.mock('@/features/subjects/server/repository', () => ({
  getSubjectRow: jest.fn(),
}))

jest.mock('@/features/plan/server/repository', () => ({
  getLessonTaskRow: jest.fn(),
  updateLessonTaskRow: jest.fn(),
  completeLessonTaskRow: jest.fn(),
  deleteLessonTaskRow: jest.fn(),
}))

import { getLessonTaskRow, updateLessonTaskRow, deleteLessonTaskRow } from '@/features/plan/server/repository'
import { GET, PUT, DELETE } from '@/features/plan/api/routes/lesson'
import { assertSessionOwnership } from '@/features/auth/server/routeOwnership'
import { getSubjectRow } from '@/features/subjects/server/repository'

const mockGet = getLessonTaskRow as jest.Mock
const mockUpdate = updateLessonTaskRow as jest.Mock
const mockAssertOwnership = assertSessionOwnership as jest.Mock
const mockGetSubject = getSubjectRow as jest.Mock

function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'lt_1',
    householdId: 'hh_test',
    learnerId: 'l1',
    subjectId: 's1',
    title: 'Task',
    dueDate: '2026-05-17',
    status: 'not_started',
    sortOrder: 0,
    description: null,
    notes: null,
    resourceLink: null,
    lessonType: null,
    estimatedDuration: null,
    completedAt: null,
    skippedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

beforeEach(() => {
  mockGet.mockReset(); mockUpdate.mockReset(); mockGetSubject.mockReset()
  mockAssertOwnership.mockReset().mockResolvedValue(undefined)
  // PUT reads the lesson first (to see whether its learner or course is changing).
  mockGet.mockResolvedValue(makeRow())
})

describe('PUT /api/plan/lessons/:id — planned start date', () => {
  function put(body: Record<string, unknown>) {
    return PUT('lt_1', new Request('http://localhost/api/plan/lessons/lt_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }))
  }

  it('leaves plannedStartDate alone when the body does not mention it', async () => {
    mockUpdate.mockResolvedValue(makeRow({ title: 'Renamed' }))
    await put({ title: 'Renamed' })
    expect(mockUpdate.mock.calls[0][2].plannedStartDate).toBeUndefined()
  })

  it('clears plannedStartDate when the body sends null', async () => {
    mockUpdate.mockResolvedValue(makeRow())
    await put({ plannedStartDate: null })
    expect(mockUpdate.mock.calls[0][2].plannedStartDate).toBeNull()
  })

  it('passes applyToGroup through to the repository', async () => {
    mockUpdate.mockResolvedValue(makeRow())
    await put({ title: 'Renamed', applyToGroup: true })
    expect(mockUpdate.mock.calls[0][3]).toEqual({ applyToGroup: true, applyScheduleToGroup: false })
  })

  it('passes applyScheduleToGroup ("move for every learner") through to the repository', async () => {
    mockUpdate.mockResolvedValue(makeRow())
    await put({ dueDate: '2026-05-20', applyToGroup: true, applyScheduleToGroup: true })
    expect(mockUpdate.mock.calls[0][3]).toEqual({ applyToGroup: true, applyScheduleToGroup: true })
  })
})

// The inline editor offers Child and Course; the route used to ignore both, so a
// "move to the right kid" edit looked saved and changed nothing.
describe('PUT /api/plan/lessons/:id — changing the learner or course', () => {
  function put(body: Record<string, unknown>) {
    return PUT('lt_1', new Request('http://localhost/api/plan/lessons/lt_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }))
  }

  beforeEach(() => {
    mockGet.mockResolvedValue(makeRow({ learnerId: 'l1', subjectId: 's1' }))
  })

  it('moves the lesson to another learner and their course', async () => {
    mockGetSubject.mockResolvedValue({ id: 's2', learnerIds: ['l2'] })
    mockUpdate.mockResolvedValue(makeRow({ learnerId: 'l2', subjectId: 's2' }))

    const res = await put({ childId: 'l2', subjectId: 's2', title: 'Task' })

    expect(res.status).toBe(200)
    expect(mockAssertOwnership).toHaveBeenCalledWith('learner', 'l2')
    expect(mockGetSubject).toHaveBeenCalledWith('s2', 'hh_test')
    expect(mockUpdate.mock.calls[0][2]).toMatchObject({ learnerId: 'l2', subjectId: 's2' })
    expect((await res.json()).data.childId).toBe('l2')
  })

  it('changes only the course for the same learner', async () => {
    mockGetSubject.mockResolvedValue({ id: 's3', learnerIds: ['l1'] })
    mockUpdate.mockResolvedValue(makeRow({ subjectId: 's3' }))

    await put({ childId: 'l1', subjectId: 's3' })

    expect(mockAssertOwnership).not.toHaveBeenCalled()
    expect(mockUpdate.mock.calls[0][2]).toMatchObject({ subjectId: 's3' })
    expect(mockUpdate.mock.calls[0][2].learnerId).toBeUndefined()
  })

  it('rejects a course the learner is not enrolled in, and saves nothing', async () => {
    mockGetSubject.mockResolvedValue({ id: 's2', learnerIds: ['l9'] })

    const res = await put({ childId: 'l2', subjectId: 's2' })

    expect(res.status).toBe(400)
    expect((await res.json()).message).toMatch(/course/i)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rejects a learner change with no course chosen', async () => {
    const res = await put({ childId: 'l2', subjectId: '' })
    expect(res.status).toBe(400)
    expect((await res.json()).message).toMatch(/choose a course/i)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('rejects a course from outside the household', async () => {
    mockGetSubject.mockResolvedValue(null)
    const res = await put({ childId: 'l1', subjectId: 's_other' })
    expect(res.status).toBe(400)
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('does not look anything up when the learner and course are unchanged', async () => {
    mockUpdate.mockResolvedValue(makeRow())
    await put({ childId: 'l1', subjectId: 's1', title: 'Renamed' })
    expect(mockAssertOwnership).not.toHaveBeenCalled()
    expect(mockGetSubject).not.toHaveBeenCalled()
    expect(mockUpdate.mock.calls[0][2].learnerId).toBeUndefined()
    expect(mockUpdate.mock.calls[0][2].subjectId).toBeUndefined()
  })
})

describe('GET /api/plan/lessons/:id', () => {
  it('returns resourceLink/lessonType/estimatedDuration when set', async () => {
    mockGet.mockResolvedValue(makeRow({
      resourceLink: 'https://example.com/video',
      lessonType: 'Video',
      estimatedDuration: '30min',
    }))

    const res = await GET('lt_1')
    const body = await res.json()

    expect(body.data.resourceLink).toBe('https://example.com/video')
    expect(body.data.lessonType).toBe('Video')
    expect(body.data.estimatedDuration).toBe('30min')
  })
})

describe('PUT /api/plan/lessons/:id', () => {
  it('returns 400 when plannedStartDate is after dueDate', async () => {
    const req = new Request('http://localhost/api/plan/lessons/lt_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plannedStartDate: '2026-06-10', dueDate: '2026-06-01' }),
    })
    const res = await PUT('lt_1', req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
  })

  it('passes resourceLink/lessonType/estimatedDuration through to the repository and back', async () => {
    mockUpdate.mockResolvedValue(makeRow({
      resourceLink: 'https://example.com/updated',
      lessonType: 'Reading',
      estimatedDuration: '1hr',
    }))

    const req = new Request('http://localhost/api/plan/lessons/lt_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resourceLink: 'https://example.com/updated',
        lessonType: 'Reading',
        estimatedDuration: '1hr',
      }),
    })

    const res = await PUT('lt_1', req)
    const body = await res.json()

    expect(mockUpdate).toHaveBeenCalledWith('lt_1', 'hh_test', expect.objectContaining({
      resourceLink: 'https://example.com/updated',
      lessonType: 'Reading',
      estimatedDuration: '1hr',
    }), { applyToGroup: false, applyScheduleToGroup: false })
    expect(body.data.resourceLink).toBe('https://example.com/updated')
    expect(body.data.lessonType).toBe('Reading')
    expect(body.data.estimatedDuration).toBe('1hr')
  })

  it('persists and returns scheduledStartTime/scheduledEndTime when both set', async () => {
    mockUpdate.mockResolvedValue(makeRow({
      scheduledStartTime: '11:00',
      scheduledEndTime: '11:30',
    }))

    const req = new Request('http://localhost/api/plan/lessons/lt_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledStartTime: '11:00', scheduledEndTime: '11:30' }),
    })

    const res = await PUT('lt_1', req)
    const body = await res.json()

    expect(mockUpdate).toHaveBeenCalledWith('lt_1', 'hh_test', expect.objectContaining({
      scheduledStartTime: '11:00',
      scheduledEndTime: '11:30',
    }), { applyToGroup: false, applyScheduleToGroup: false })
    expect(body.data.scheduledStartTime).toBe('11:00')
    expect(body.data.scheduledEndTime).toBe('11:30')
  })

  it('returns 400 and does not persist when scheduledEndTime <= scheduledStartTime', async () => {
    const req = new Request('http://localhost/api/plan/lessons/lt_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledStartTime: '11:30', scheduledEndTime: '11:00' }),
    })

    const res = await PUT('lt_1', req)
    expect(res.status).toBe(400)
    const body = await res.json()
    expect(body.status).toBe('error')
    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('clears scheduledStartTime/scheduledEndTime when both submitted as null', async () => {
    mockUpdate.mockResolvedValue(makeRow({ scheduledStartTime: null, scheduledEndTime: null }))

    const req = new Request('http://localhost/api/plan/lessons/lt_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledStartTime: null, scheduledEndTime: null }),
    })

    const res = await PUT('lt_1', req)
    const body = await res.json()

    expect(mockUpdate).toHaveBeenCalledWith('lt_1', 'hh_test', expect.objectContaining({
      scheduledStartTime: null,
      scheduledEndTime: null,
    }), { applyToGroup: false, applyScheduleToGroup: false })
    expect(body.data.scheduledStartTime).toBeUndefined()
    expect(body.data.scheduledEndTime).toBeUndefined()
  })
})

describe('DELETE /api/plan/lessons/:id', () => {
  const mockDelete = deleteLessonTaskRow as jest.Mock
  beforeEach(() => mockDelete.mockReset())
  const del = (q = '') => DELETE('lt_1', new Request(`http://localhost/api/plan/lessons/lt_1${q}`, { method: 'DELETE' }))

  it('deletes one copy by default and says how many were removed', async () => {
    mockDelete.mockResolvedValue(1)
    const res = await del()
    expect(mockDelete).toHaveBeenCalledWith('lt_1', 'hh_test', { deleteGroup: false })
    expect(res.status).toBe(200)
    expect((await res.json()).data).toEqual({ deleted: 1 })
  })

  it('deleteGroup=true removes every copy and reports the count', async () => {
    mockDelete.mockResolvedValue(5)
    const res = await del('?deleteGroup=true')
    expect(mockDelete).toHaveBeenCalledWith('lt_1', 'hh_test', { deleteGroup: true })
    expect((await res.json()).data).toEqual({ deleted: 5 })
  })

  it('404 when nothing was deleted', async () => {
    mockDelete.mockResolvedValue(0)
    const res = await del()
    expect(res.status).toBe(404)
  })
})

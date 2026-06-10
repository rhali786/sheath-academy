/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/plan/server/repository', () => ({
  getLessonTaskRow: jest.fn(),
  updateLessonTaskRow: jest.fn(),
  completeLessonTaskRow: jest.fn(),
  deleteLessonTaskRow: jest.fn(),
}))

import { getLessonTaskRow, updateLessonTaskRow } from '@/features/plan/server/repository'
import { GET, PUT } from '@/features/plan/api/routes/lesson'

const mockGet = getLessonTaskRow as jest.Mock
const mockUpdate = updateLessonTaskRow as jest.Mock

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

beforeEach(() => { mockGet.mockReset(); mockUpdate.mockReset() })

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
    }), { applyToGroup: false })
    expect(body.data.resourceLink).toBe('https://example.com/updated')
    expect(body.data.lessonType).toBe('Reading')
    expect(body.data.estimatedDuration).toBe('1hr')
  })
})

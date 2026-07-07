/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/subjects/server/repository', () => ({
  getSubjectRow: jest.fn(),
  updateSubjectRow: jest.fn(),
  archiveSubjectRow: jest.fn(),
}))

import { getSubjectRow, updateSubjectRow } from '@/features/subjects/server/repository'
import { GET, PUT } from '@/features/subjects/api/routes/subject'

const mockGet = getSubjectRow as jest.Mock
const mockUpdate = updateSubjectRow as jest.Mock

const baseRow = {
  id: 'subject_1',
  learnerIds: ['learner_1'],
  learnerId: 'learner_1',
  resourceIds: ['resource_1'],
  name: 'Algebra',
  category: 'Math',
  schoolYearId: 'sy_active',
  isActive: true,
  sortOrder: 0,
  createdAt: new Date(),
}

beforeEach(() => {
  mockGet.mockReset()
  mockUpdate.mockReset()
})

describe('GET /api/subjects/:id', () => {
  it('includes resourceIds in the response', async () => {
    mockGet.mockResolvedValue(baseRow)
    const res = await GET('subject_1')
    const body = await res.json()
    expect(body.data.resourceIds).toEqual(['resource_1'])
  })
})

describe('PUT /api/subjects/:id', () => {
  it('passes resourceIds from the request body through to updateSubjectRow and returns them', async () => {
    mockUpdate.mockResolvedValue({ ...baseRow, resourceIds: ['resource_1', 'resource_2'] })

    const req = new Request('http://localhost/api/subjects/subject_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ resourceIds: ['resource_1', 'resource_2'] }),
    })
    const res = await PUT('subject_1', req)
    const body = await res.json()

    expect(mockUpdate).toHaveBeenCalledWith(
      'subject_1',
      'hh_test',
      expect.objectContaining({ resourceIds: ['resource_1', 'resource_2'] })
    )
    expect(body.data.resourceIds).toEqual(['resource_1', 'resource_2'])
  })

  it('does not pass resourceIds when omitted from the request body', async () => {
    mockUpdate.mockResolvedValue(baseRow)

    const req = new Request('http://localhost/api/subjects/subject_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Geometry' }),
    })
    await PUT('subject_1', req)

    expect(mockUpdate).toHaveBeenCalledWith(
      'subject_1',
      'hh_test',
      expect.objectContaining({ resourceIds: undefined })
    )
  })

  it('passes gradebook course-config (Phase 6) through to updateSubjectRow', async () => {
    mockUpdate.mockResolvedValue(baseRow)
    const req = new Request('http://localhost/api/subjects/subject_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        creditHours: 4, isFormalCourse: true, termModel: 'semester',
        gradingScaleId: 'gs1', aggregationRuleId: 'ar1',
      }),
    })
    await PUT('subject_1', req)
    expect(mockUpdate).toHaveBeenCalledWith('subject_1', 'hh_test', expect.objectContaining({
      creditHours: 4, isFormalCourse: true, termModel: 'semester',
      gradingScaleId: 'gs1', aggregationRuleId: 'ar1',
    }))
  })

  it('clears course-config ids when empty strings are sent', async () => {
    mockUpdate.mockResolvedValue(baseRow)
    const req = new Request('http://localhost/api/subjects/subject_1', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gradingScaleId: '', aggregationRuleId: '', creditHours: null }),
    })
    await PUT('subject_1', req)
    expect(mockUpdate).toHaveBeenCalledWith('subject_1', 'hh_test', expect.objectContaining({
      gradingScaleId: null, aggregationRuleId: null, creditHours: null,
    }))
  })
})

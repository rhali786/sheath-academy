/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/school-year/server/service', () => ({
  getActiveSchoolYear: jest.fn(),
}))

jest.mock('@/features/subjects/server/repository', () => ({
  listSubjectRows: jest.fn(),
  createSubjectRow: jest.fn(),
}))

import { getActiveSchoolYear } from '@/features/school-year/server/service'
import { listSubjectRows, createSubjectRow } from '@/features/subjects/server/repository'
import { GET, POST } from '@/features/subjects/api/routes/subjects'

const mockGetActiveYear = getActiveSchoolYear as jest.Mock
const mockList = listSubjectRows as jest.Mock
const mockCreate = createSubjectRow as jest.Mock

const activeYear = {
  id: 'sy_active',
  workspaceId: 'hh_test',
  name: '2025-2026',
  startDate: '2025-08-01',
  endDate: '2026-06-30',
  isActive: true,
  createdAt: new Date().toISOString(),
}

beforeEach(() => {
  mockGetActiveYear.mockReset()
  mockList.mockReset()
  mockCreate.mockReset()
  mockGetActiveYear.mockResolvedValue(activeYear)
})

describe('GET /api/subjects', () => {
  it('scopes list to active school year when configured', async () => {
    mockList.mockResolvedValue([])
    await GET(new Request('http://localhost/api/subjects'))
    expect(mockList).toHaveBeenCalledWith('hh_test', undefined, false, {
      schoolYearId: 'sy_active',
    })
  })

  it('falls back to unfiltered list when no active year', async () => {
    mockGetActiveYear.mockResolvedValue(null)
    mockList.mockResolvedValue([])
    await GET(new Request('http://localhost/api/subjects'))
    expect(mockList).toHaveBeenCalledWith('hh_test', undefined, false, undefined)
  })

  it('GET ?childId=<secondary> includes a course where the child is a secondary enrollee', async () => {
    mockList.mockResolvedValue([
      {
        id: 'subject_shared',
        learnerIds: ['learner_primary', 'learner_secondary'],
        learnerId: 'learner_primary',
        resourceIds: [],
        name: 'Group Science',
        category: 'Science',
        schoolYearId: 'sy_active',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
      },
    ])
    const res = await GET(new Request('http://localhost/api/subjects?childId=learner_secondary'))
    const body = await res.json()

    expect(mockList).toHaveBeenCalledWith('hh_test', 'learner_secondary', false, {
      schoolYearId: 'sy_active',
    })
    expect(body.data.map((s: { id: string }) => s.id)).toContain('subject_shared')
  })

  it('includes resourceIds in each returned subject', async () => {
    mockList.mockResolvedValue([
      {
        id: 'subject_1',
        learnerIds: ['learner_1'],
        learnerId: 'learner_1',
        resourceIds: ['resource_1', 'resource_2'],
        name: 'Algebra',
        category: 'Math',
        schoolYearId: 'sy_active',
        isActive: true,
        sortOrder: 0,
        createdAt: new Date(),
      },
    ])
    const res = await GET(new Request('http://localhost/api/subjects'))
    const body = await res.json()
    expect(body.data[0].resourceIds).toEqual(['resource_1', 'resource_2'])
  })
})

describe('POST /api/subjects', () => {
  it('stamps resolved active year onto created row', async () => {
    mockCreate.mockResolvedValue({
      id: 'subject_1',
      learnerIds: ['learner_1'],
      learnerId: 'learner_1',
      name: 'Algebra',
      category: 'Math',
      schoolYearId: 'sy_active',
      isActive: true,
      sortOrder: 0,
      createdAt: new Date(),
    })

    const req = new Request('http://localhost/api/subjects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childId: 'learner_1', name: 'Algebra', category: 'Math' }),
    })
    const res = await POST(req)
    const body = await res.json()

    expect(res.status).toBe(201)
    expect(mockCreate).toHaveBeenCalledWith('hh_test', {
      name: 'Algebra',
      category: 'Math',
      learnerIds: ['learner_1'],
      schoolYearId: 'sy_active',
    })
    expect(body.data.schoolYearId).toBe('sy_active')
  })
})

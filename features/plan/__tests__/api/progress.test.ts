/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_test', userId: 'user_test', timezone: 'UTC' })
})

jest.mock('@/features/plan/server/repository', () => ({
  listLessonTaskRows: jest.fn(),
}))

jest.mock('@/features/children/server/repository', () => ({
  listLearners: jest.fn(),
}))

jest.mock('@/features/subjects/server/repository', () => ({
  listSubjectRows: jest.fn(),
}))

import { listLessonTaskRows } from '@/features/plan/server/repository'
import { listLearners } from '@/features/children/server/repository'
import { listSubjectRows } from '@/features/subjects/server/repository'
import { GET } from '@/features/plan/api/routes/progress'

const mockListRows = listLessonTaskRows as jest.Mock
const mockListLearners = listLearners as jest.Mock
const mockListSubjects = listSubjectRows as jest.Mock

beforeEach(() => {
  mockListRows.mockReset().mockResolvedValue([])
  mockListLearners.mockReset().mockResolvedValue([])
  mockListSubjects.mockReset().mockResolvedValue([])
})

describe('GET /api/plan/progress', () => {
  it('returns 400 when scope is missing', async () => {
    const res = await GET(new Request('http://localhost/api/plan/progress?start=2026-05-01&end=2026-05-31'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when scope is invalid', async () => {
    const res = await GET(new Request('http://localhost/api/plan/progress?scope=month&start=2026-05-01&end=2026-05-31'))
    expect(res.status).toBe(400)
  })

  it('returns 400 when start or end missing', async () => {
    const res = await GET(new Request('http://localhost/api/plan/progress?scope=week'))
    expect(res.status).toBe(400)
  })

  it('returns success with empty data', async () => {
    const res = await GET(new Request('http://localhost/api/plan/progress?scope=week&start=2026-05-10&end=2026-05-16'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(Array.isArray(body.data)).toBe(true)
  })
})

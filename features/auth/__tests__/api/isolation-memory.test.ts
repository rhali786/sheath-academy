/** @jest-environment node */

jest.mock('@/features/auth/auth', () => ({
  auth: jest.fn(),
}))

jest.mock('@/features/lib/server/db', () => ({
  isPostgresMode: jest.fn(() => false),
}))

jest.mock('@/features/household/server/service', () => {
  const actual = jest.requireActual('@/features/household/server/service')
  return {
    ...actual,
    getHouseholdProfile: jest.fn(),
  }
})

import { auth } from '@/features/auth/auth'
import { getHouseholdProfile } from '@/features/household/server/service'
import { GET as childrenGet } from '@/features/children/api/routes/children'
import { GET as childGet } from '@/features/children/api/routes/child'
import { POST as attendancePost } from '@/features/attendance/api/routes/attendance'
import {
  createStudentProfile,
  resetStore as resetChildrenStore,
} from '@/features/children/server/service'
import { resetStore as resetHouseholdStore } from '@/features/household/server/service'
import { resetStore as resetAttendanceStore } from '@/features/attendance/server/service'

const mockAuth = auth as jest.Mock
const mockGetHouseholdProfile = getHouseholdProfile as jest.Mock

const HOUSEHOLD_A = 'household_test_a'
const HOUSEHOLD_B = 'household_test_b'

describe('API isolation (memory mode)', () => {
  let learnerAId: string
  let learnerBId: string

  beforeEach(() => {
    resetChildrenStore()
    resetHouseholdStore()
    resetAttendanceStore()

    mockAuth.mockResolvedValue({
      user: { id: 'user_a', email: 'user-a@test.local', name: 'User A' },
    })
    mockGetHouseholdProfile.mockReturnValue({
      id: HOUSEHOLD_A,
      workspaceId: 'workspace_iso',
      familyName: 'Family A',
      createdAt: new Date().toISOString(),
    })

    learnerAId = createStudentProfile({
      householdId: HOUSEHOLD_A,
      name: 'Learner A',
      gradeLabel: 'G1',
      username: 'a',
      password: 'p',
    }).id

    learnerBId = createStudentProfile({
      householdId: HOUSEHOLD_B,
      name: 'Learner B',
      gradeLabel: 'G2',
      username: 'b',
      password: 'p',
    }).id
  })

  test('GET /children lists only session household learners', async () => {
    const res = await childrenGet(new Request('http://localhost/api/children'))
    expect(res.status).toBe(200)
    const body = await res.json()
    const names = (body.data as { name: string }[]).map(p => p.name)
    expect(names).toContain('Learner A')
    expect(names).not.toContain('Learner B')
  })

  test('GET /children/:id returns 404 for foreign learner', async () => {
    const res = await childGet(learnerBId)
    expect(res.status).toBe(404)
  })

  test('POST /attendance with foreign childId returns 404', async () => {
    const res = await attendancePost(
      new Request('http://localhost/api/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childId: learnerBId,
          date: '2026-05-22',
          status: 'present',
        }),
      }),
    )
    expect(res.status).toBe(404)
  })
})

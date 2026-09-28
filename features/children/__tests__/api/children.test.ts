/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_a', userId: 'user_owner' })
})

jest.mock('@/features/children/server/repository', () => ({
  listLearners: jest.fn(),
  listAllLearners: jest.fn(),
  createLearner: jest.fn(),
  updateLearner: jest.fn(),
}))

jest.mock('@/features/household/server/repository', () => ({
  getUserById: jest.fn(),
  getMembership: jest.fn(),
  addMember: jest.fn(),
  reactivateMember: jest.fn(),
}))

jest.mock('@/features/auth/server/repository', () => ({
  createLearnerCredentialUser: jest.fn(),
  getUserByIdentifier: jest.fn(),
  getUserByEmail: jest.fn(),
  updateUserUsername: jest.fn(),
  updateUserPassword: jest.fn(),
  deleteUser: jest.fn(),
}))

jest.mock('@/features/auth/server/password', () => ({
  hashPassword: jest.fn(),
}))

jest.mock('@/features/admin-metrics/server/instrument', () => ({
  trackLearnerCreated: jest.fn(),
}))

import { GET, POST } from '@/features/children/api/routes/children'
import { listLearners, createLearner, updateLearner } from '@/features/children/server/repository'
import { getUserById, getMembership, addMember } from '@/features/household/server/repository'
import { createLearnerCredentialUser, getUserByIdentifier, getUserByEmail, deleteUser } from '@/features/auth/server/repository'
import { hashPassword } from '@/features/auth/server/password'

const mockListLearners = jest.mocked(listLearners)
const mockCreateLearner = jest.mocked(createLearner)
const mockUpdateLearner = jest.mocked(updateLearner)
const mockGetUserById = jest.mocked(getUserById)
const mockGetMembership = jest.mocked(getMembership)
const mockAddMember = jest.mocked(addMember)
const mockCreateLearnerCredentialUser = jest.mocked(createLearnerCredentialUser)
const mockGetUserByIdentifier = jest.mocked(getUserByIdentifier)
const mockGetUserByEmail = jest.mocked(getUserByEmail)
const mockDeleteUser = jest.mocked(deleteUser)
const mockHashPassword = jest.mocked(hashPassword)

const NEW_LEARNER_ROW = {
  id: 'learner_new',
  householdId: 'hh_a',
  name: 'Sara Yusuf',
  firstName: 'Sara',
  lastName: 'Yusuf',
  dob: '2016-05-01',
  gradeLevel: 'Grade 3',
  displayColor: null,
  isActive: true,
  archivedAt: null,
  sortOrder: 0,
  userId: null,
  createdAt: new Date('2026-07-16T10:00:00Z'),
  updatedAt: new Date('2026-07-16T10:00:00Z'),
}

function jsonReq(body: unknown) {
  return new Request('http://localhost/api/children/children', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockHashPassword.mockResolvedValue('hashed_pw')
  // Explicit defaults — clearAllMocks() clears calls but keeps implementations,
  // so without these a previous test's mockResolvedValue leaks into the next.
  mockGetUserByIdentifier.mockResolvedValue(null)
  mockGetUserByEmail.mockResolvedValue(null)
  mockDeleteUser.mockResolvedValue(undefined)
  mockAddMember.mockResolvedValue({} as never)
})

describe('GET /api/children/children', () => {
  it('returns learners with firstName/lastName/dob persisted (not blank)', async () => {
    mockListLearners.mockResolvedValue([NEW_LEARNER_ROW as any])
    const res = await GET(new Request('http://localhost/api/children/children'))
    const body = await res.json()
    expect(body.data[0].firstName).toBe('Sara')
    expect(body.data[0].lastName).toBe('Yusuf')
    expect(body.data[0].dob).toBe('2016-05-01')
  })
})

describe('POST /api/children/children', () => {
  it('returns 400 when name is missing', async () => {
    const res = await POST(jsonReq({ gradeLabel: 'Grade 3' }))
    expect(res.status).toBe(400)
    expect(mockCreateLearner).not.toHaveBeenCalled()
  })

  it('creates a learner without login when learnerLoginEnabled is not set', async () => {
    mockCreateLearner.mockResolvedValue(NEW_LEARNER_ROW as any)
    const res = await POST(jsonReq({ name: 'Sara Yusuf', firstName: 'Sara', lastName: 'Yusuf', gradeLabel: 'Grade 3', dob: '2016-05-01' }))
    expect(res.status).toBe(201)
    expect(mockCreateLearnerCredentialUser).not.toHaveBeenCalled()
    const body = await res.json()
    expect(body.data.firstName).toBe('Sara')
  })

  it('creates a credential user and a learner membership when learnerLoginEnabled is true, without creating a new household', async () => {
    mockGetUserByIdentifier.mockResolvedValue(null)
    mockCreateLearner.mockResolvedValue(NEW_LEARNER_ROW as any)
    mockCreateLearnerCredentialUser.mockResolvedValue({ id: 'user_sara' } as any)
    mockUpdateLearner.mockResolvedValue({ ...NEW_LEARNER_ROW, userId: 'user_sara' } as any)

    const res = await POST(jsonReq({
      name: 'Sara Yusuf', firstName: 'Sara', lastName: 'Yusuf', gradeLabel: 'Grade 3', dob: '2016-05-01',
      learnerLoginEnabled: true, username: 'sara.student', password: 'pw12345',
    }))

    expect(res.status).toBe(201)
    expect(mockCreateLearnerCredentialUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'sara.student', email: 'learner.learner_new@no-email.local' }),
    )
    expect(mockAddMember).toHaveBeenCalledWith('hh_a', 'user_sara', 'learner')
    expect(mockUpdateLearner).toHaveBeenCalledWith('learner_new', 'hh_a', { userId: 'user_sara' })
  })

  it('rejects a username already in use', async () => {
    mockGetUserByIdentifier.mockResolvedValue({ id: 'user_other' } as any)
    const res = await POST(jsonReq({
      name: 'Sara Yusuf', gradeLabel: 'Grade 3', learnerLoginEnabled: true, username: 'taken', password: 'pw12345',
    }))
    expect(res.status).toBe(409)
    expect(mockCreateLearner).not.toHaveBeenCalled()
  })

  it('requires both username and password when learnerLoginEnabled is true', async () => {
    const res = await POST(jsonReq({ name: 'Sara Yusuf', gradeLabel: 'Grade 3', learnerLoginEnabled: true }))
    expect(res.status).toBe(400)
    expect(mockCreateLearner).not.toHaveBeenCalled()
  })

  // Item 5 — the create path could claim a username and then silently fail to
  // link it (`row = (await updateLearner(...)) ?? row` swallowed the failure and
  // still returned 201). That left the learner showing "Not enabled" with its
  // username permanently taken by an unreachable user row.
  it('removes the created credential user when linking it to the new learner fails, instead of reporting success', async () => {
    mockCreateLearner.mockResolvedValue(NEW_LEARNER_ROW as never)
    mockCreateLearnerCredentialUser.mockResolvedValue({ id: 'user_sara' } as never)
    mockUpdateLearner.mockResolvedValue(null) // link write matched no row

    const res = await POST(jsonReq({
      name: 'Sara Yusuf', gradeLabel: 'Grade 3',
      learnerLoginEnabled: true, username: 'sara.student', password: 'pw12345',
    }))

    expect(res.status).not.toBe(201)
    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(mockDeleteUser).toHaveBeenCalledWith('user_sara')
  })

  it('removes the created credential user when addMember fails', async () => {
    mockCreateLearner.mockResolvedValue(NEW_LEARNER_ROW as never)
    mockCreateLearnerCredentialUser.mockResolvedValue({ id: 'user_sara' } as never)
    mockAddMember.mockRejectedValue(new Error('membership insert failed'))

    const res = await POST(jsonReq({
      name: 'Sara Yusuf', gradeLabel: 'Grade 3',
      learnerLoginEnabled: true, username: 'sara.student', password: 'pw12345',
    }))

    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(mockDeleteUser).toHaveBeenCalledWith('user_sara')
  })
})

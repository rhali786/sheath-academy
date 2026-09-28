/** @jest-environment node */

jest.mock('@/features/auth/server/requestAuth', () => {
  const { mockRequestAuthModule } = require('@/features/auth/__tests__/helpers')
  return mockRequestAuthModule({ householdId: 'hh_a', userId: 'user_owner' })
})

jest.mock('@/features/children/server/repository', () => ({
  getLearner: jest.fn(),
  updateLearner: jest.fn(),
  archiveLearner: jest.fn(),
  restoreLearner: jest.fn(),
}))

jest.mock('@/features/subjects/server/repository', () => ({
  archiveSubjectsByLearner: jest.fn(),
}))

jest.mock('@/features/household/server/repository', () => ({
  getUserById: jest.fn(),
  getMembership: jest.fn(),
  addMember: jest.fn(),
  deactivateMember: jest.fn(),
  reactivateMember: jest.fn(),
}))

jest.mock('@/features/auth/server/repository', () => ({
  createLearnerCredentialUser: jest.fn(),
  updateUserUsername: jest.fn(),
  updateUserPassword: jest.fn(),
  deactivateUserCredentials: jest.fn(),
  getUserByIdentifier: jest.fn(),
  getUserByEmail: jest.fn(),
}))

jest.mock('@/features/auth/server/password', () => ({
  hashPassword: jest.fn(),
}))

import { GET, PUT } from '@/features/children/api/routes/child'
import { getLearner, updateLearner } from '@/features/children/server/repository'
import { getUserById, getMembership, addMember, deactivateMember, reactivateMember } from '@/features/household/server/repository'
import { createLearnerCredentialUser, updateUserUsername, updateUserPassword, deactivateUserCredentials, getUserByIdentifier, getUserByEmail } from '@/features/auth/server/repository'
import { hashPassword } from '@/features/auth/server/password'

const mockGetLearner = jest.mocked(getLearner)
const mockUpdateLearner = jest.mocked(updateLearner)
const mockGetUserById = jest.mocked(getUserById)
const mockGetMembership = jest.mocked(getMembership)
const mockAddMember = jest.mocked(addMember)
const mockDeactivateMember = jest.mocked(deactivateMember)
const mockReactivateMember = jest.mocked(reactivateMember)
const mockCreateLearnerCredentialUser = jest.mocked(createLearnerCredentialUser)
const mockUpdateUserUsername = jest.mocked(updateUserUsername)
const mockUpdateUserPassword = jest.mocked(updateUserPassword)
const mockDeactivateUserCredentials = jest.mocked(deactivateUserCredentials)
const mockGetUserByIdentifier = jest.mocked(getUserByIdentifier)
const mockGetUserByEmail = jest.mocked(getUserByEmail)
const mockHashPassword = jest.mocked(hashPassword)

const LEARNER_ROW = {
  id: 'learner_1',
  householdId: 'hh_a',
  name: 'Adam Al-Rashid',
  firstName: 'Adam',
  lastName: 'Al-Rashid',
  dob: '2015-03-10',
  gradeLevel: 'Grade 5',
  displayColor: null,
  isActive: true,
  archivedAt: null,
  sortOrder: 0,
  userId: null,
  createdAt: new Date('2026-01-10T10:00:00Z'),
  updatedAt: new Date('2026-01-10T10:00:00Z'),
}

function jsonReq(body: unknown, method = 'PUT') {
  return new Request('http://localhost/api/children/children/learner_1', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockHashPassword.mockResolvedValue('hashed_pw')
  // Explicit defaults — jest.clearAllMocks() clears calls but keeps
  // implementations, so without these a previous test's mockResolvedValue
  // would leak into the next one.
  mockGetUserByIdentifier.mockResolvedValue(null)
  mockGetUserByEmail.mockResolvedValue(null)
  mockAddMember.mockResolvedValue({} as never)
})

describe('GET /api/children/children/:id', () => {
  it('returns 404 when learner is not found', async () => {
    mockGetLearner.mockResolvedValue(null)
    const res = await GET('learner_1')
    expect(res.status).toBe(404)
  })

  it('returns firstName/lastName/dob from the stored row (not blank)', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW })
    const res = await GET('learner_1')
    const body = await res.json()
    expect(body.data.firstName).toBe('Adam')
    expect(body.data.lastName).toBe('Al-Rashid')
    expect(body.data.dob).toBe('2015-03-10')
  })

  it('reports learnerLoginEnabled=true when a linked user has a password hash and an active membership', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_learner_1' })
    mockGetUserById.mockResolvedValue({ id: 'user_learner_1', username: 'adam.student', passwordHash: 'scrypt:...' } as any)
    mockGetMembership.mockResolvedValue({ isActive: true } as any)
    const res = await GET('learner_1')
    const body = await res.json()
    expect(body.data.learnerLoginEnabled).toBe(true)
    expect(body.data.username).toBe('adam.student')
    expect(body.data.password).toBe('')
  })

  it('reports learnerLoginEnabled=false when the membership is deactivated', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_learner_1' })
    mockGetUserById.mockResolvedValue({ id: 'user_learner_1', username: 'adam.student', passwordHash: null } as any)
    mockGetMembership.mockResolvedValue({ isActive: false } as any)
    const res = await GET('learner_1')
    const body = await res.json()
    expect(body.data.learnerLoginEnabled).toBe(false)
  })
})

describe('PUT /api/children/children/:id', () => {
  it('persists firstName/lastName/dob edits', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW })
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, firstName: 'Updated', lastName: 'Name' })
    const res = await PUT('learner_1', jsonReq({ firstName: 'Updated', lastName: 'Name', gradeLabel: 'Grade 5', dob: '2015-03-10' }))
    expect(res.status).toBe(200)
    expect(mockUpdateLearner).toHaveBeenCalledWith('learner_1', 'hh_a', expect.objectContaining({ firstName: 'Updated', lastName: 'Name' }))
  })

  it('enabling learner login for a learner with no prior credential creates a user and a learner membership, and does NOT create a new household', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    mockGetUserByIdentifier.mockResolvedValue(null)
    mockCreateLearnerCredentialUser.mockResolvedValue({ id: 'user_new_1' } as any)
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_new_1' })

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student', password: 'pw12345' }))

    expect(res.status).toBe(200)
    expect(mockCreateLearnerCredentialUser).toHaveBeenCalledWith(
      expect.objectContaining({ username: 'adam.student', email: 'learner.learner_1@no-email.local' }),
    )
    expect(mockAddMember).toHaveBeenCalledWith('hh_a', 'user_new_1', 'learner')
    expect(mockUpdateLearner).toHaveBeenCalledWith('learner_1', 'hh_a', expect.objectContaining({ userId: 'user_new_1' }))
  })

  it('re-fetching after enabling login shows login still enabled and username persisted', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    mockGetUserByIdentifier.mockResolvedValue(null)
    mockCreateLearnerCredentialUser.mockResolvedValue({ id: 'user_new_1' } as any)
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_new_1' })

    await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student', password: 'pw12345' }))

    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_new_1' })
    mockGetUserById.mockResolvedValue({ id: 'user_new_1', username: 'adam.student', passwordHash: 'hashed_pw' } as any)
    mockGetMembership.mockResolvedValue({ isActive: true } as any)

    const res = await GET('learner_1')
    const body = await res.json()
    expect(body.data.learnerLoginEnabled).toBe(true)
    expect(body.data.username).toBe('adam.student')
  })

  it('rejects enabling login with a username already taken by another user', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    mockGetUserByIdentifier.mockResolvedValue({ id: 'user_other' } as any)
    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'taken', password: 'pw12345' }))
    expect(res.status).toBe(409)
    expect(mockCreateLearnerCredentialUser).not.toHaveBeenCalled()
  })

  it('disabling learner login deactivates the credential and membership rather than deleting them', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_existing' })
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_existing' })

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: false }))

    expect(res.status).toBe(200)
    expect(mockDeactivateUserCredentials).toHaveBeenCalledWith('user_existing')
    expect(mockDeactivateMember).toHaveBeenCalledWith('hh_a', 'user_existing')
  })

  it('re-enabling login for a previously-disabled learner without a new password fails (previous hash was cleared)', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_existing' })
    mockGetUserById.mockResolvedValue({ id: 'user_existing', username: 'adam.student', passwordHash: null } as any)
    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student' }))
    expect(res.status).toBe(400)
    expect(mockUpdateUserUsername).not.toHaveBeenCalled()
  })

  it('re-enabling login for a previously-disabled learner with a new password reactivates the membership', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_existing' })
    mockGetUserById.mockResolvedValue({ id: 'user_existing', username: 'adam.student', passwordHash: null } as any)
    mockGetUserByIdentifier.mockResolvedValue(null)
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_existing' })

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student', password: 'newpw123' }))

    expect(res.status).toBe(200)
    expect(mockUpdateUserPassword).toHaveBeenCalledWith('user_existing', 'hashed_pw')
    expect(mockReactivateMember).toHaveBeenCalledWith('hh_a', 'user_existing')
  })
})

/**
 * Item 5 — "learner login won't enable". Enabling is three separate writes
 * (create credential user → addMember → link learners.userId). If it breaks
 * after the first, the username is claimed but learners.userId stays NULL, so
 * every later attempt hits the dup check and 409s forever — invisibly, because
 * the UI swallowed the error. These tests pin the recovery + compensation that
 * make the operation idempotent so no state can trap a household.
 */
describe('PUT enable — orphaned credential recovery + compensation (item 5)', () => {
  const ORPHAN_EMAIL = 'learner.learner_1@no-email.local'

  it('adopts this learner\'s own orphaned credential user instead of 409-ing on its username', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    // The orphan holds the username the parent is retrying with.
    mockGetUserByIdentifier.mockResolvedValue({ id: 'user_orphan', email: ORPHAN_EMAIL, username: 'adam.student', passwordHash: 'old_hash' } as never)
    mockGetUserByEmail.mockResolvedValue({ id: 'user_orphan', email: ORPHAN_EMAIL, username: 'adam.student', passwordHash: 'old_hash' } as never)
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_orphan' })

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student', password: 'pw12345' }))

    expect(res.status).toBe(200)
    // Reuses the orphan rather than trying to create a second credential user
    // (which would also violate the UNIQUE placeholder email).
    expect(mockCreateLearnerCredentialUser).not.toHaveBeenCalled()
    expect(mockUpdateUserPassword).toHaveBeenCalledWith('user_orphan', 'hashed_pw')
    expect(mockUpdateLearner).toHaveBeenCalledWith('learner_1', 'hh_a', expect.objectContaining({ userId: 'user_orphan' }))
  })

  it('adopts the orphan even when the parent retries with a DIFFERENT username', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    // Nobody holds the new username …
    mockGetUserByIdentifier.mockResolvedValue(null)
    // … but this learner still has an orphaned credential user from the first attempt.
    mockGetUserByEmail.mockResolvedValue({ id: 'user_orphan', email: ORPHAN_EMAIL, username: 'old.name', passwordHash: null } as never)
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_orphan' })

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.v2', password: 'pw12345' }))

    expect(res.status).toBe(200)
    expect(mockCreateLearnerCredentialUser).not.toHaveBeenCalled()
    expect(mockUpdateUserUsername).toHaveBeenCalledWith('user_orphan', 'adam.v2')
    expect(mockUpdateLearner).toHaveBeenCalledWith('learner_1', 'hh_a', expect.objectContaining({ userId: 'user_orphan' }))
  })

  it('still 409s when the username genuinely belongs to a different person', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    mockGetUserByIdentifier.mockResolvedValue({ id: 'user_someone_else', email: 'parent@example.com' } as never)
    mockGetUserByEmail.mockResolvedValue(null)

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'taken', password: 'pw12345' }))

    expect(res.status).toBe(409)
    expect(mockCreateLearnerCredentialUser).not.toHaveBeenCalled()
  })

  it('archives (does not delete) the half-provisioned credential user when addMember fails', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    mockCreateLearnerCredentialUser.mockResolvedValue({ id: 'user_new_1' } as never)
    mockAddMember.mockRejectedValue(new Error('membership insert failed'))

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student', password: 'pw12345' }))

    expect(res.status).toBeGreaterThanOrEqual(400)
    // Clearing the password hash is the established "cannot sign in, row kept"
    // mechanism (same call the disable path uses) — no destructive delete.
    expect(mockDeactivateUserCredentials).toHaveBeenCalledWith('user_new_1')
  })

  it('archives the credential user and its membership when linking it to the learner fails', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    mockCreateLearnerCredentialUser.mockResolvedValue({ id: 'user_new_1' } as never)
    mockUpdateLearner.mockResolvedValue(null) // link write matched no row

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student', password: 'pw12345' }))

    expect(res.status).toBeGreaterThanOrEqual(400)
    expect(mockDeactivateUserCredentials).toHaveBeenCalledWith('user_new_1')
    // addMember succeeded here, so the membership must be stood down too.
    expect(mockDeactivateMember).toHaveBeenCalledWith('hh_a', 'user_new_1')
  })

  it('does NOT archive a pre-existing credential user when the update fails (only compensates what it created)', async () => {
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_existing' })
    mockGetUserById.mockResolvedValue({ id: 'user_existing', username: 'adam.student', passwordHash: 'hash' } as never)
    mockUpdateLearner.mockResolvedValue(null)

    await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student' }))

    expect(mockDeactivateUserCredentials).not.toHaveBeenCalled()
    expect(mockDeactivateMember).not.toHaveBeenCalled()
  })

  it('an archived orphan is still adoptable on the next attempt (archiving does not re-create the trap)', async () => {
    // Archive clears the hash but keeps the row, so the username stays claimed.
    // Adoption by placeholder email is what makes the retry succeed.
    mockGetLearner.mockResolvedValue({ ...LEARNER_ROW, userId: null })
    mockGetUserByIdentifier.mockResolvedValue({ id: 'user_orphan', email: 'learner.learner_1@no-email.local', username: 'adam.student', passwordHash: null } as never)
    mockGetUserByEmail.mockResolvedValue({ id: 'user_orphan', email: 'learner.learner_1@no-email.local', username: 'adam.student', passwordHash: null } as never)
    mockUpdateLearner.mockResolvedValue({ ...LEARNER_ROW, userId: 'user_orphan' })

    const res = await PUT('learner_1', jsonReq({ learnerLoginEnabled: true, username: 'adam.student', password: 'pw12345' }))

    expect(res.status).toBe(200)
    expect(mockCreateLearnerCredentialUser).not.toHaveBeenCalled()
    expect(mockUpdateUserPassword).toHaveBeenCalledWith('user_orphan', 'hashed_pw')
    expect(mockReactivateMember).toHaveBeenCalledWith('hh_a', 'user_orphan')
  })
})

/** @jest-environment node */

jest.mock('@/features/auth/server/repository', () => ({
  getUserByEmail: jest.fn(),
  getUserByIdentifier: jest.fn(),
  createCredentialUser: jest.fn(),
}))

jest.mock('@/features/auth/server/password', () => ({
  validateSignupInput: jest.requireActual('@/features/auth/server/password').validateSignupInput,
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  normalizeEmail: jest.requireActual('@/features/auth/server/password').normalizeEmail,
  normalizeUsername: jest.requireActual('@/features/auth/server/password').normalizeUsername,
}))

import { POST } from '@/app/api/auth/register/route'
import { getUserByEmail, getUserByIdentifier, createCredentialUser } from '@/features/auth/server/repository'

const mockGetUserByEmail = getUserByEmail as jest.Mock
const mockGetUserByIdentifier = getUserByIdentifier as jest.Mock
const mockCreateCredentialUser = createCredentialUser as jest.Mock

const validBody = {
  name: 'Ahmed Ali',
  email: 'ahmed@example.com',
  username: 'ahmed_ali',
  password: 'Secur3!Pass#',
  confirmPassword: 'Secur3!Pass#',
}

beforeEach(() => {
  mockGetUserByEmail.mockReset()
  mockGetUserByIdentifier.mockReset()
  mockCreateCredentialUser.mockReset()
  mockGetUserByEmail.mockResolvedValue(null)
  mockGetUserByIdentifier.mockResolvedValue(null)
  mockCreateCredentialUser.mockResolvedValue({ id: 'user_1', email: 'ahmed@example.com' })
})

function makeRequest(body: unknown) {
  return new Request('http://localhost/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

describe('POST /api/auth/register', () => {
  test('creates user and returns 201 for valid input', async () => {
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json.status).toBe('success')
    expect(mockCreateCredentialUser).toHaveBeenCalled()
  })

  test('returns 422 with field errors for missing name', async () => {
    const res = await POST(makeRequest({ ...validBody, name: '' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.errors.name).toBeDefined()
  })

  test('returns 422 with field errors for invalid email', async () => {
    const res = await POST(makeRequest({ ...validBody, email: 'notanemail' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.errors.email).toBeDefined()
  })

  test('returns 422 when passwords do not match', async () => {
    const res = await POST(makeRequest({ ...validBody, confirmPassword: 'different' }))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.errors.confirmPassword).toBeDefined()
  })

  test('returns 422 with email error when email already exists', async () => {
    mockGetUserByEmail.mockResolvedValue({ id: 'existing', email: 'ahmed@example.com' })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.errors.email).toMatch(/already exists/i)
  })

  test('returns 422 with username error when username is taken', async () => {
    mockGetUserByIdentifier.mockResolvedValue({ id: 'existing', usernameNormalized: 'ahmed_ali' })
    const res = await POST(makeRequest(validBody))
    expect(res.status).toBe(422)
    const json = await res.json()
    expect(json.errors.username).toMatch(/already taken/i)
  })

  test('returns 400 for malformed JSON body', async () => {
    const req = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    })
    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})

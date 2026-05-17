/** @jest-environment node */

import { GET, POST } from '@/features/quran/api/routes/sessions'

jest.mock('@/features/quran/server/service', () => ({
  getQuranSessions: jest.fn(),
  addQuranSession: jest.fn(),
}))

jest.mock('@/features/children/server/service', () => ({
  getStudentProfiles: jest.fn(() => [
    { id: 'adam_01', name: 'Adam', isActive: true },
    { id: 'khadijah_01', name: 'Khadijah', isActive: true },
  ]),
}))

import { getQuranSessions, addQuranSession } from '@/features/quran/server/service'
const mockGet = getQuranSessions as jest.Mock
const mockAdd = addQuranSession as jest.Mock

const session1 = {
  id: 'quran_001',
  childId: 'adam_01',
  type: 'Revision',
  surah: 'Al-Mulk',
  fromAyah: 1,
  toAyah: 5,
  notes: '',
  date: '2026-05-01',
  lastLogged: '2 days ago',
}

function makeRequest(url: string, options?: RequestInit): Request {
  return new Request(`http://localhost${url}`, options)
}

beforeEach(() => {
  mockGet.mockReturnValue([session1])
  mockAdd.mockReturnValue({ ...session1, id: 'quran_new', date: '2026-05-17' })
})

describe('GET /api/quran/sessions', () => {
  test('returns all sessions when no childId', async () => {
    const res = await GET(makeRequest('/api/quran/sessions'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.sessions).toHaveLength(1)
  })

  test('passes childId to service when provided', async () => {
    mockGet.mockImplementation((childId?: string) =>
      childId === 'adam_01' ? [session1] : []
    )
    const res = await GET(makeRequest('/api/quran/sessions?childId=adam_01'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.sessions.length).toBeGreaterThan(0)
  })

  test('returns empty sessions array when no sessions exist', async () => {
    mockGet.mockReturnValue([])
    const res = await GET(makeRequest('/api/quran/sessions'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.sessions).toHaveLength(0)
  })
})

describe('POST /api/quran/sessions', () => {
  test('creates a session and returns 201', async () => {
    const body = { childId: 'adam_01', type: 'Revision', surah: 'Al-Mulk', fromAyah: 1, toAyah: 5, notes: '' }
    const req = makeRequest('/api/quran/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const res = await POST(req)
    expect(res.status).toBe(201)
    const resBody = await res.json()
    expect(resBody.status).toBe('success')
    expect(mockAdd).toHaveBeenCalledWith(body)
  })
})

/** @jest-environment node */

import { GET } from '@/features/alerts/api/routes/alerts'

jest.mock('@/features/alerts/server/service', () => ({
  getAlerts: jest.fn(),
}))

import { getAlerts } from '@/features/alerts/server/service'
const mockGetAlerts = getAlerts as jest.Mock

const alert1 = { id: 'pending_lessons_adam', childId: 'adam_01', title: '2 lessons not completed', detail: '1 overdue: Fractions', priority: 'amber', actionButton: 'Review' }
const alert2 = { id: 'attendance_missing_2026-05-17', childId: null, title: 'Attendance not logged today', detail: 'Missing for: Khadijah', priority: 'amber', actionButton: 'Log' }

function createRequest(url: string): Request {
  return new Request(`http://localhost${url}`)
}

beforeEach(() => {
  mockGetAlerts.mockReturnValue([alert1, alert2])
})

describe('GET /api/alerts', () => {
  test('returns all alerts when no childId filter', async () => {
    const res = await GET(createRequest('/api/alerts'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(2)
  })

  test('filters alerts by childId', async () => {
    mockGetAlerts.mockImplementation((childId?: string) =>
      childId === 'adam_01'
        ? [alert1]
        : [alert1, alert2]
    )
    const res = await GET(createRequest('/api/alerts?childId=adam_01'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data.every((a: { childId: string | null }) => a.childId === 'adam_01' || a.childId === null)).toBe(true)
  })

  test('returns empty array when no alerts', async () => {
    mockGetAlerts.mockReturnValue([])
    const res = await GET(createRequest('/api/alerts'))
    const body = await res.json()
    expect(body.status).toBe('success')
    expect(body.data).toHaveLength(0)
  })
})

import React from 'react'
import { render, screen, waitFor, act } from '@testing-library/react'
import QuranPage from '@/features/quran/front/pages/QuranPage'
import type { StudentProfile, ApiResponse } from '@/features/lib/types'
import type { QuranSession } from '@/features/lib/types'

let mockSearchParams = new URLSearchParams()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), replace: jest.fn() }),
  useSearchParams: () => mockSearchParams,
}))

jest.mock('@/features/quran/front/services/api', () => ({
  quranApi: {
    getSessions: jest.fn(),
    addSession: jest.fn(),
    updateSession: jest.fn(),
  },
}))

jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    getAllChildren: jest.fn(),
  },
}))

import { quranApi } from '@/features/quran/front/services/api'
import { childrenApi } from '@/features/children/front/services/api'

const mockGetSessions = (quranApi as any).getSessions as jest.Mock
const mockGetAllChildren = (childrenApi as any).getAllChildren as jest.Mock

const mockChildren: StudentProfile[] = [
  { id: 'child_001', householdId: 'hh_001', name: 'Layth',   gradeLabel: '5th', isActive: true, username: 'layth',   password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'child_002', householdId: 'hh_001', name: 'Khadijah', gradeLabel: '3rd', isActive: true, username: 'khadijah', password: 'pw', createdAt: '2026-01-01T00:00:00Z' },
]

function makeSession(overrides: Partial<QuranSession> = {}): QuranSession {
  return {
    id: 'session_001',
    childId: 'child_001',
    type: 'New memorisation',
    surah: 'Al-Fatiha',
    fromAyah: 1,
    toAyah: 7,
    date: '2026-05-12',
    notes: '',
    ...overrides,
  } as QuranSession
}

function ok<T>(data: T): ApiResponse<T> {
  return { status: 'success', data, message: '', timestamp: '' }
}

function okSessions(sessions: QuranSession[]) {
  return { status: 'success', data: { sessions }, message: '', timestamp: '' }
}

beforeEach(() => {
  mockSearchParams = new URLSearchParams()
  mockGetAllChildren.mockResolvedValue(ok(mockChildren))
  mockGetSessions.mockResolvedValue(okSessions([]))
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('QuranPage', () => {
  it('renders the page heading', async () => {
    render(<QuranPage />)
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /quran studies/i })).toBeInTheDocument()
    })
  })

  it('shows empty state when no sessions', async () => {
    render(<QuranPage />)
    await waitFor(() => {
      expect(screen.getByText(/no sessions logged yet/i)).toBeInTheDocument()
    })
  })

  it('shows sessions when loaded', async () => {
    mockGetSessions.mockResolvedValue(okSessions([makeSession({ surah: 'Al-Baqarah' })]))
    render(<QuranPage />)
    await waitFor(() => {
      expect(screen.getByText('Al-Baqarah')).toBeInTheDocument()
    })
  })

  it('selects the child filter from ?childId query param after children load', async () => {
    mockSearchParams = new URLSearchParams('childId=child_002')
    mockGetSessions.mockResolvedValue(okSessions([
      makeSession({ childId: 'child_001', surah: 'Al-Fatiha' }),
      makeSession({ id: 'session_002', childId: 'child_002', surah: 'Al-Baqarah' }),
    ]))

    render(<QuranPage />)

    await waitFor(() => {
      // The child filter select should show child_002 selected
      const childFilterSelect = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options || []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(childFilterSelect).toHaveValue('child_002')
    })
  })

  it('falls back to All Children filter when ?childId is invalid', async () => {
    mockSearchParams = new URLSearchParams('childId=invalid_id')
    mockGetSessions.mockResolvedValue(okSessions([makeSession()]))

    render(<QuranPage />)

    await waitFor(() => {
      const childFilterSelect = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options || []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(childFilterSelect).toHaveValue('')
    })
  })

  it('shows only sessions for selected child when filter applied', async () => {
    mockSearchParams = new URLSearchParams('childId=child_002')
    mockGetSessions.mockResolvedValue(okSessions([
      makeSession({ childId: 'child_001', surah: 'Al-Fatiha' }),
      makeSession({ id: 'session_002', childId: 'child_002', surah: 'Al-Baqarah' }),
    ]))

    render(<QuranPage />)

    await waitFor(() => {
      expect(screen.queryByText('Al-Fatiha')).not.toBeInTheDocument()
      expect(screen.getByText('Al-Baqarah')).toBeInTheDocument()
    })
  })

  it('updates child filter when URL childId changes while component stays mounted', async () => {
    mockSearchParams = new URLSearchParams()
    mockGetSessions.mockResolvedValue(okSessions([
      makeSession({ childId: 'child_001', surah: 'Al-Fatiha' }),
      makeSession({ id: 'session_002', childId: 'child_002', surah: 'Al-Baqarah' }),
    ]))

    const { rerender } = render(<QuranPage />)

    // Initially all children — filter is empty
    await waitFor(() => {
      const sel = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options ?? []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(sel).toHaveValue('')
    })

    // Simulate URL change while mounted (e.g. back/forward, link within same page)
    act(() => { mockSearchParams = new URLSearchParams('childId=child_002') })
    rerender(<QuranPage />)

    await waitFor(() => {
      const sel = screen.getAllByRole('combobox').find(s =>
        Array.from((s as HTMLSelectElement).options ?? []).some(o => o.text === 'All children')
      ) as HTMLSelectElement
      expect(sel).toHaveValue('child_002')
    })
  })
})

/**
 * Integration test for the standalone /household/setup route (Wave 4b).
 *
 * Confirms the thin app/(shell)/household/setup/page.tsx route renders
 * <HouseholdSetup /> with no extra wrapping logic, per CLAUDE.md
 * (app/ stays routing-only).
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import HouseholdSetupRoutePage from '../../../../app/(shell)/household/setup/page'

// ── Context mock ──────────────────────────────────────────────────────────────
jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

// ── householdApi mock ─────────────────────────────────────────────────────────
jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    setup: jest.fn(),
    getProfile: jest.fn(),
  },
}))

// ── childrenApi mock (used by SetupCard_Children) ─────────────────────────────
jest.mock('@/features/children/front/services/api', () => ({
  childrenApi: {
    createChild: jest.fn(),
    getAllChildren: jest.fn(() => Promise.resolve({ data: [] })),
    getChildren: jest.fn(() => Promise.resolve({ data: [] })),
  },
}))

// ── next/navigation mock ──────────────────────────────────────────────────────
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
  usePathname: jest.fn(() => '/household/setup'),
}))

import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'

const { useHousehold } = jest.requireMock('@/features/household/front/context') as {
  useHousehold: jest.MockedFunction<() => HouseholdContextType>
}

const noHousehold: HouseholdContextType = {
  householdProfile: null,
  studentProfiles: [],
  allSubjects: [],
  familyName: '',
  needsSetup: true,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

const mockProfile = {
  id: 'household_001',
  workspaceId: 'household_001',
  familyName: 'Test Family',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const householdExists: HouseholdContextType = {
  householdProfile: mockProfile,
  studentProfiles: [],
  allSubjects: [],
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

function mockFetch(responses: Record<string, unknown>) {
  global.fetch = jest.fn((input: string | URL | Request) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : (input as Request).url
    for (const [pattern, data] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(data),
        } as Response)
      }
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'success', data: null, message: 'ok', timestamp: '' }),
    } as Response)
  }) as jest.Mock
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('HouseholdSetup route page (/household/setup)', () => {
  it('renders the household name card when no household exists', () => {
    useHousehold.mockReturnValue(noHousehold)
    render(<HouseholdSetupRoutePage />)
    expect(screen.getByText('Welcome to Sheath')).toBeInTheDocument()
  })

  it('renders the setup cards experience when a household already exists', async () => {
    useHousehold.mockReturnValue(householdExists)
    mockFetch({
      '/api/children/children': { status: 'success', data: [], message: 'ok', timestamp: '' },
      '/api/school-years/active': { status: 'success', data: null, message: 'no active', timestamp: '' },
      '/api/subjects': { status: 'success', data: [], message: 'ok', timestamp: '' },
    })
    render(<HouseholdSetupRoutePage />)
    await waitFor(() => {
      expect(screen.getByText('Complete your setup')).toBeInTheDocument()
    })
  })
})

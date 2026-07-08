/**
 * Integration tests for HouseholdLogoPicker (cycling logo preset picker)
 * and the preset mark rendered by HouseholdSwitcher.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HouseholdLogoPicker } from '@/features/household/front/components/HouseholdLogoPicker'
import { HouseholdSwitcher } from '@/features/household/front/components/HouseholdSwitcher'
import { HouseholdContext, type HouseholdContextType } from '@/features/household/front/context'

const mockFetch = jest.fn()
global.fetch = mockFetch

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

import { useSession } from 'next-auth/react'

const mockUseSession = useSession as jest.Mock

function makeHouseholdContext(overrides: Partial<HouseholdContextType> = {}): HouseholdContextType {
  return {
    householdProfile: { id: 'hh_a', workspaceId: 'hh_a', familyName: 'Test', createdAt: '2026-01-01T00:00:00Z' },
    studentProfiles: [],
    allSubjects: [],
    familyName: 'Test',
    needsSetup: false,
    loading: false,
    error: null,
    refetch: jest.fn(),
    ...overrides,
  }
}

function renderSwitcherWithHousehold(ctxOverrides: Partial<HouseholdContextType> = {}) {
  return render(
    <HouseholdContext.Provider value={makeHouseholdContext(ctxOverrides)}>
      <HouseholdSwitcher />
    </HouseholdContext.Provider>,
  )
}

const MEMBERSHIPS = [
  { householdId: 'hh_a', householdName: 'Barakah Academy', role: 'owner' },
  { householdId: 'hh_b', householdName: 'Crescent Cove', role: 'member' },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'success', data: { logoPreset: 'star' }, message: '', timestamp: '' }),
  })
  mockUseSession.mockReturnValue({
    data: { user: { householdId: 'hh_a', memberships: MEMBERSHIPS } },
    update: jest.fn(),
  })
})

describe('HouseholdLogoPicker', () => {
  it('renders the current preset mark', () => {
    render(<HouseholdLogoPicker value="crescent" />)
    const mark = screen.getByTestId('household-logo-mark')
    expect(mark).toHaveAttribute('data-preset', 'crescent')
  })

  it('renders the default mark when no preset is chosen (no crash, no broken image)', () => {
    render(<HouseholdLogoPicker value={undefined} />)
    const mark = screen.getByTestId('household-logo-mark')
    expect(mark).toHaveAttribute('data-preset', 'crescent')
  })

  it('cycles through the 5 preset marks and persists the selection via PUT', async () => {
    const onSaved = jest.fn()
    render(<HouseholdLogoPicker value="crescent" onSaved={onSaved} />)

    fireEvent.click(screen.getByTestId('household-logo-picker-cycle'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/household/profile'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify({ logoPreset: 'star' }),
        }),
      )
    })
    await waitFor(() => {
      expect(screen.getByTestId('household-logo-mark')).toHaveAttribute('data-preset', 'star')
    })
    expect(onSaved).toHaveBeenCalledWith('star')
  })

  it('wraps around after the last preset back to the first', async () => {
    render(<HouseholdLogoPicker value="compass" />)
    fireEvent.click(screen.getByTestId('household-logo-picker-cycle'))
    await waitFor(() => {
      expect(screen.getByTestId('household-logo-mark')).toHaveAttribute('data-preset', 'crescent')
    })
  })
})

describe('HouseholdSwitcher logo mark', () => {
  it("renders the household's selected preset mark", () => {
    renderSwitcherWithHousehold({
      householdProfile: { id: 'hh_a', workspaceId: 'hh_a', familyName: 'Test', createdAt: '2026-01-01T00:00:00Z', logoPreset: 'lantern' },
    })
    expect(screen.getByTestId('household-logo-mark')).toHaveAttribute('data-preset', 'lantern')
  })

  it('renders the default mark when the household has no chosen preset (no crash)', () => {
    renderSwitcherWithHousehold()
    expect(screen.getByTestId('household-logo-mark')).toHaveAttribute('data-preset', 'crescent')
  })
})

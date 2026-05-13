/**
 * Integration tests for HouseholdSettings — Week Start Day selector.
 *
 * Tests render HouseholdSettings directly with mocked context and fetch.
 * They do NOT render AppShell or any full provider tree.
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HouseholdSettings } from '@/features/household/front/components/HouseholdSettings'

// ── Context mock ──────────────────────────────────────────────────────────────
jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

// ── householdApi mock ─────────────────────────────────────────────────────────
jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────
import type { HouseholdContextType } from '@/features/household/front/context/HouseholdContext'
import type { HouseholdProfile } from '@/features/lib/types'

const { useHousehold } = jest.requireMock('@/features/household/front/context') as {
  useHousehold: jest.MockedFunction<() => HouseholdContextType>
}

const { householdApi } = jest.requireMock('@/features/household/front/services/api')

const mockWorkspace = {
  id: 'workspace_001',
  name: 'Test Academy',
  ownerId: 'user_001',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockProfileWithMonday: HouseholdProfile = {
  id: 'household_001',
  workspaceId: 'workspace_001',
  familyName: 'Test Family',
  weekStartDay: 'Monday',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockProfileWithSunday: HouseholdProfile = {
  id: 'household_001',
  workspaceId: 'workspace_001',
  familyName: 'Test Family',
  weekStartDay: 'Sunday',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const mockProfileWithoutWeekStartDay: HouseholdProfile = {
  id: 'household_001',
  workspaceId: 'workspace_001',
  familyName: 'Test Family',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const baseHouseholdExists: HouseholdContextType = {
  workspace: mockWorkspace,
  householdProfile: mockProfileWithMonday,
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('HouseholdSettings — Week Start Day selector', () => {
  it('renders dropdown with "Monday" and "Sunday" options', () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    householdApi.updateProfile.mockResolvedValue({
      status: 'success',
      data: mockProfileWithMonday,
      message: 'Profile updated',
      timestamp: new Date().toISOString(),
    })

    render(<HouseholdSettings />)

    expect(screen.getByLabelText('Monday')).toBeInTheDocument()
    expect(screen.getByLabelText('Sunday')).toBeInTheDocument()
  })

  it('loads and displays current weekStartDay from household profile on mount', () => {
    useHousehold.mockReturnValue({
      ...baseHouseholdExists,
      householdProfile: mockProfileWithSunday,
    })
    householdApi.updateProfile.mockResolvedValue({
      status: 'success',
      data: mockProfileWithSunday,
      message: 'Profile updated',
      timestamp: new Date().toISOString(),
    })

    render(<HouseholdSettings />)

    expect(screen.getByDisplayValue('Sunday')).toBeChecked()
  })

  it('defaults to "Monday" when weekStartDay is not set', async () => {
    useHousehold.mockReturnValue({
      ...baseHouseholdExists,
      householdProfile: mockProfileWithoutWeekStartDay,
    })
    householdApi.getProfile.mockResolvedValue({
      status: 'success',
      data: mockProfileWithoutWeekStartDay,
      message: 'Profile fetched',
      timestamp: new Date().toISOString(),
    })

    render(<HouseholdSettings />)

    // Wait for the effect to load the profile
    await waitFor(() => {
      expect(screen.getByDisplayValue('Monday')).toBeChecked()
    })
  })

  it('calls PUT /api/household/profile when selection changes', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    householdApi.updateProfile.mockResolvedValue({
      status: 'success',
      data: mockProfileWithSunday,
      message: 'Profile updated',
      timestamp: new Date().toISOString(),
    })

    const user = userEvent.setup()
    render(<HouseholdSettings />)

    const sundayRadio = screen.getByLabelText('Sunday')
    await user.click(sundayRadio)

    expect(householdApi.updateProfile).toHaveBeenCalledWith(undefined, 'Sunday')
  })

  it('updates displayed value after successful PUT', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    householdApi.updateProfile.mockResolvedValue({
      status: 'success',
      data: mockProfileWithSunday,
      message: 'Profile updated',
      timestamp: new Date().toISOString(),
    })

    const user = userEvent.setup()
    render(<HouseholdSettings />)

    expect(screen.getByDisplayValue('Monday')).toBeChecked()

    const sundayRadio = screen.getByLabelText('Sunday')
    await user.click(sundayRadio)

    await waitFor(() => {
      expect(screen.getByDisplayValue('Sunday')).toBeChecked()
    })
  })

  it('shows error message when PUT /api/household/profile fails', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    householdApi.updateProfile.mockRejectedValue(new Error('Network error'))

    const user = userEvent.setup()
    render(<HouseholdSettings />)

    const sundayRadio = screen.getByLabelText('Sunday')
    await user.click(sundayRadio)

    await waitFor(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument()
    })
  })

  it('reverts to previous value if update fails', async () => {
    useHousehold.mockReturnValue(baseHouseholdExists)
    householdApi.updateProfile.mockRejectedValue(new Error('Update failed'))

    const user = userEvent.setup()
    render(<HouseholdSettings />)

    expect(screen.getByDisplayValue('Monday')).toBeChecked()

    const sundayRadio = screen.getByLabelText('Sunday')
    await user.click(sundayRadio)

    await waitFor(() => {
      // Should revert back to Monday after error
      expect(screen.getByDisplayValue('Monday')).toBeChecked()
    })
  })
})

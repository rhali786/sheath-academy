/**
 * Integration tests for HouseholdSettings — expanded household settings form (FB-007).
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { HouseholdSettings } from '@/features/household/front/components/HouseholdSettings'

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

jest.mock('@/features/household/front/services/api', () => ({
  householdApi: {
    getProfile: jest.fn(),
    updateProfile: jest.fn(),
  },
}))

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

const mockProfileMonday: HouseholdProfile = {
  id: 'household_001',
  workspaceId: 'workspace_001',
  familyName: 'Test Family',
  weekStartDay: 'Monday',
  createdAt: '2026-01-01T00:00:00.000Z',
}

const baseCtx: HouseholdContextType = {
  workspace: mockWorkspace,
  householdProfile: mockProfileMonday,
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
  householdApi.updateProfile.mockResolvedValue({
    status: 'success',
    data: mockProfileMonday,
    message: 'Profile updated',
    timestamp: new Date().toISOString(),
  })
  useHousehold.mockReturnValue(baseCtx)
})

describe('HouseholdSettings — week start day', () => {
  it('renders a week-start dropdown with all 7 days', () => {
    render(<HouseholdSettings />)
    const select = screen.getByLabelText('Week starts on')
    expect(select).toBeInTheDocument()
    const options = Array.from((select as HTMLSelectElement).options).map(o => o.value)
    expect(options).toEqual(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'])
  })

  it('shows Monday selected when profile has weekStartDay = Monday', () => {
    render(<HouseholdSettings />)
    expect(screen.getByLabelText('Week starts on')).toHaveValue('Monday')
  })

  it('shows Saturday selected when profile has weekStartDay = Saturday', () => {
    useHousehold.mockReturnValue({
      ...baseCtx,
      householdProfile: { ...mockProfileMonday, weekStartDay: 'Saturday' },
    })
    render(<HouseholdSettings />)
    expect(screen.getByLabelText('Week starts on')).toHaveValue('Saturday')
  })
})

describe('HouseholdSettings — school days checkboxes', () => {
  it('renders checkboxes for all 7 days', () => {
    render(<HouseholdSettings />)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    days.forEach(day => {
      expect(screen.getByRole('checkbox', { name: day })).toBeInTheDocument()
    })
  })

  it('Mon–Fri are checked by default when profile has no schoolDays', () => {
    useHousehold.mockReturnValue({
      ...baseCtx,
      householdProfile: { ...mockProfileMonday, schoolDays: undefined },
    })
    render(<HouseholdSettings />)
    expect(screen.getByRole('checkbox', { name: 'Monday' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Friday' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Saturday' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Sunday' })).not.toBeChecked()
  })

  it('toggling a day marks form as having unsaved changes', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.click(screen.getByRole('checkbox', { name: 'Saturday' }))
    expect(screen.getByRole('alert')).toHaveTextContent(/unsaved changes/i)
  })
})

describe('HouseholdSettings — day-load preferences', () => {
  it('renders a load dropdown for each day of the week', () => {
    render(<HouseholdSettings />)
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    days.forEach(day => {
      expect(screen.getByRole('combobox', { name: `${day} load` })).toBeInTheDocument()
    })
  })

  it('changing a day load marks form as unsaved', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.selectOptions(screen.getByRole('combobox', { name: 'Monday load' }), 'Heavy')
    expect(screen.getByRole('alert')).toHaveTextContent(/unsaved changes/i)
  })
})

describe('HouseholdSettings — reporting name', () => {
  it('renders reporting name input', () => {
    render(<HouseholdSettings />)
    expect(screen.getByLabelText(/school \/ reporting name/i)).toBeInTheDocument()
  })

  it('typing in the reporting name shows unsaved-changes warning', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.type(screen.getByLabelText(/school \/ reporting name/i), 'Al-Noor')
    expect(screen.getByRole('alert')).toHaveTextContent(/unsaved changes/i)
  })
})

describe('HouseholdSettings — date display and timezone', () => {
  it('renders date display selector', () => {
    render(<HouseholdSettings />)
    expect(screen.getByLabelText('Date display')).toBeInTheDocument()
  })

  it('renders timezone selector', () => {
    render(<HouseholdSettings />)
    expect(screen.getByLabelText('Timezone')).toBeInTheDocument()
  })
})

describe('HouseholdSettings — save', () => {
  it('Save button is disabled when there are no unsaved changes', () => {
    render(<HouseholdSettings />)
    expect(screen.getByRole('button', { name: /save settings/i })).toBeDisabled()
  })

  it('Save button becomes enabled after a change', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.selectOptions(screen.getByLabelText('Week starts on'), 'Sunday')
    expect(screen.getByRole('button', { name: /save settings/i })).not.toBeDisabled()
  })

  it('clicking Save calls householdApi.updateProfile with all form fields', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.selectOptions(screen.getByLabelText('Week starts on'), 'Sunday')
    await user.click(screen.getByRole('button', { name: /save settings/i }))
    expect(householdApi.updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ weekStartDay: 'Sunday' })
    )
  })

  it('shows success message after save', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.selectOptions(screen.getByLabelText('Week starts on'), 'Sunday')
    await user.click(screen.getByRole('button', { name: /save settings/i }))
    await waitFor(() => {
      expect(screen.getByText(/settings saved/i)).toBeInTheDocument()
    })
  })

  it('shows error message when save fails', async () => {
    householdApi.updateProfile.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.selectOptions(screen.getByLabelText('Week starts on'), 'Sunday')
    await user.click(screen.getByRole('button', { name: /save settings/i }))
    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument()
    })
  })
})

describe('HouseholdSettings — unsaved changes warning', () => {
  it('shows warning banner when form differs from saved state', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    await user.selectOptions(screen.getByLabelText('Week starts on'), 'Wednesday')
    expect(screen.getByRole('alert')).toHaveTextContent(/unsaved changes/i)
  })

  it('warning disappears after successful save', async () => {
    const user = userEvent.setup()
    render(<HouseholdSettings />)
    await user.selectOptions(screen.getByLabelText('Week starts on'), 'Wednesday')
    await user.click(screen.getByRole('button', { name: /save settings/i }))
    await waitFor(() => {
      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    })
  })
})

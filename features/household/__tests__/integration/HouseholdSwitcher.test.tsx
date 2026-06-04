/**
 * Integration tests for HouseholdSwitcher.
 * Tests the switcher renders only with ≥2 memberships, shows names, and calls the switch API.
 */
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { HouseholdSwitcher } from '@/features/household/front/components/HouseholdSwitcher'

const mockUpdate = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
  signOut: jest.fn(),
}))

const mockFetch = jest.fn()
global.fetch = mockFetch

import { useSession } from 'next-auth/react'
const mockUseSession = useSession as jest.Mock

const MEMBERSHIPS = [
  { householdId: 'hh_a', householdName: 'Barakah Academy', role: 'owner' },
  { householdId: 'hh_b', householdName: 'Crescent Cove', role: 'member' },
]

beforeEach(() => {
  jest.clearAllMocks()
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({ status: 'success', data: { householdId: 'hh_b', timezone: 'America/Chicago' }, message: '', timestamp: '' }),
  })
})

describe('HouseholdSwitcher', () => {
  it('renders nothing when user has fewer than 2 memberships', () => {
    mockUseSession.mockReturnValue({
      data: { user: { householdId: 'hh_a', memberships: [MEMBERSHIPS[0]] } },
      update: mockUpdate,
    })
    const { container } = render(<HouseholdSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when memberships are absent', () => {
    mockUseSession.mockReturnValue({
      data: { user: { householdId: 'hh_a' } },
      update: mockUpdate,
    })
    const { container } = render(<HouseholdSwitcher />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a trigger button when user has 2 or more memberships', () => {
    mockUseSession.mockReturnValue({
      data: { user: { householdId: 'hh_a', memberships: MEMBERSHIPS } },
      update: mockUpdate,
    })
    render(<HouseholdSwitcher />)
    expect(screen.getByRole('button', { name: /switch household|barakah academy/i })).toBeInTheDocument()
  })

  it('shows all household names in the dropdown when opened', () => {
    mockUseSession.mockReturnValue({
      data: { user: { householdId: 'hh_a', memberships: MEMBERSHIPS } },
      update: mockUpdate,
    })
    render(<HouseholdSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /switch household/i }))
    const options = screen.getAllByRole('option')
    const names = options.map(o => o.textContent)
    expect(names.join(' ')).toContain('Barakah Academy')
    expect(names.join(' ')).toContain('Crescent Cove')
  })

  it('marks the current household as active', () => {
    mockUseSession.mockReturnValue({
      data: { user: { householdId: 'hh_a', memberships: MEMBERSHIPS } },
      update: mockUpdate,
    })
    render(<HouseholdSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /switch household/i }))
    const activeOption = screen.getByRole('option', { selected: true })
    expect(activeOption).toBeInTheDocument()
    expect(activeOption.textContent).toContain('Barakah Academy')
  })

  it('calls the switch API and updates the session when a different household is selected', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { householdId: 'hh_a', memberships: MEMBERSHIPS } },
      update: mockUpdate,
    })
    render(<HouseholdSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /switch household/i }))
    const options = screen.getAllByRole('option')
    const crescentOption = options.find(o => o.textContent?.includes('Crescent Cove'))!
    fireEvent.click(crescentOption)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/household/switch'),
        expect.objectContaining({ method: 'POST' }),
      )
    })
    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({ householdId: 'hh_b' }),
      )
    })
  })

  it('does not call the switch API when the current household is selected', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { householdId: 'hh_a', memberships: MEMBERSHIPS } },
      update: mockUpdate,
    })
    render(<HouseholdSwitcher />)
    fireEvent.click(screen.getByRole('button', { name: /switch household/i }))
    const options = screen.getAllByRole('option')
    const barakahOption = options.find(o => o.textContent?.includes('Barakah Academy'))!
    fireEvent.click(barakahOption)

    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })
  })
})

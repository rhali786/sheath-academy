import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { BadgesPage } from '@/features/badges/front/pages/BadgesPage'

jest.mock('@/features/badges/front/services/api', () => ({
  badgesApi: {
    getCollection: jest.fn(),
    getSettings: jest.fn(),
  },
}))

jest.mock('@/features/layout/front/context/LearnerContext', () => ({
  useLearner: jest.fn(),
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

import { badgesApi } from '@/features/badges/front/services/api'
import { useHousehold } from '@/features/household/front/context'
import { useLearner } from '@/features/layout/front/context/LearnerContext'
import { mockBadgeCollection } from '@/features/badges/__tests__/fixtures/mockBadges'

const mockGetCollection = badgesApi.getCollection as jest.Mock
const mockGetSettings = badgesApi.getSettings as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock
const mockUseLearner = useLearner as jest.Mock

const mockHouseholdValue = {
  householdProfile: { id: 'hh_fix_001', familyName: 'Test Family', workspaceId: 'ws1', createdAt: '' },
  studentProfiles: [
    { id: 'student_seed_layth_001', name: 'Layth', householdId: 'hh_fix_001', gradeLabel: '7th', isActive: true, username: 'layth', password: '', createdAt: '' },
  ],
  allSubjects: [],
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

function ok<T>(data: T) {
  return Promise.resolve({ status: 'success', data, message: 'ok', timestamp: '' })
}

describe('BadgesPage', () => {
  beforeEach(() => {
    mockUseHousehold.mockImplementation(() => mockHouseholdValue)
    mockUseLearner.mockImplementation(() => ({ selectedChildId: 'student_seed_layth_001', setSelectedChildId: jest.fn() }))
    mockGetCollection.mockImplementation(() => ok(mockBadgeCollection))
    mockGetSettings.mockImplementation(() => ok({ householdId: 'hh_fix_001', platformBadgesEnabled: true }))
  })

  afterEach(() => {
    mockUseHousehold.mockReset()
    mockUseLearner.mockReset()
    mockGetCollection.mockReset()
    mockGetSettings.mockReset()
  })

  it('shows loading state initially', () => {
    mockGetCollection.mockImplementation(() => new Promise(() => {}))
    render(<BadgesPage />)
    expect(screen.getByTestId('badges-loading')).toBeInTheDocument()
  })

  it('shows error state when API fails', async () => {
    mockGetCollection.mockImplementation(() => Promise.reject(new Error('fail')))
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badges-error')).toBeInTheDocument()
    })
  })

  it('shows empty state with starter set when no badges yet', async () => {
    mockGetCollection.mockImplementation(() => ok([]))
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badges-empty')).toBeInTheDocument()
      expect(screen.getByText(/No badges yet/i)).toBeInTheDocument()
    })
  })

  it('shows trophy case with earned badges', async () => {
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badges-trophy-case')).toBeInTheDocument()
      expect(screen.getByText('Quran Champion')).toBeInTheDocument()
    })
  })

  it('earned badge renders as earned (full color)', async () => {
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badge-earned-badge_fix_001')).toBeInTheDocument()
    })
  })

  it('not-yet-earned badge shows "Not yet earned" label (US7 — never "Locked")', async () => {
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badge-locked-badge_fix_002')).toBeInTheDocument()
      expect(screen.getAllByText(/Not yet earned/i).length).toBeGreaterThan(0)
      expect(screen.queryByText(/^Locked$/i)).not.toBeInTheDocument()
    })
  })

  it('not-yet-earned badge shows "How to earn this" criteria', async () => {
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByText(/Score 90 or above on 5 consecutive/i)).toBeInTheDocument()
    })
  })

  it('earned badge has accessible name including "earned"', async () => {
    render(<BadgesPage />)
    await waitFor(() => {
      const earnedEl = screen.getByTestId('badge-earned-badge_fix_001')
      expect(earnedEl).toHaveAttribute('aria-label', expect.stringContaining('earned'))
    })
  })

  it('not-yet-earned badge has accessible name indicating "not yet earned"', async () => {
    render(<BadgesPage />)
    await waitFor(() => {
      const lockedEl = screen.getByTestId('badge-locked-badge_fix_002')
      expect(lockedEl).toHaveAttribute('aria-label', expect.stringContaining('not yet earned'))
    })
  })

  it('shows the selected learner name in the page header', async () => {
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badges-learner-name')).toHaveTextContent('Layth')
    })
  })

  it('calls getCollection with the selected learnerId', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badges-trophy-case')).toBeInTheDocument())
    expect(mockGetCollection).toHaveBeenCalledWith('hh_fix_001', 'student_seed_layth_001')
  })
})

import React from 'react'
import { render, screen, waitFor, fireEvent, within } from '@testing-library/react'
import { BadgesPage } from '@/features/badges/front/pages/BadgesPage'

jest.mock('@/features/badges/front/services/api', () => ({
  badgesApi: {
    getCollection: jest.fn(),
    getSettings: jest.fn(),
    createAward: jest.fn(),
    advanceAward: jest.fn(),
    deleteAward: jest.fn(),
    addEvidence: jest.fn(),
    removeEvidence: jest.fn(),
    setSettings: jest.fn(),
    createDefinition: jest.fn(),
    updateDefinition: jest.fn(),
    deleteDefinition: jest.fn(),
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
const mockCreateAward = badgesApi.createAward as jest.Mock
const mockAdvanceAward = badgesApi.advanceAward as jest.Mock
const mockDeleteAward = badgesApi.deleteAward as jest.Mock
const mockAddEvidence = badgesApi.addEvidence as jest.Mock
const mockRemoveEvidence = badgesApi.removeEvidence as jest.Mock
const mockSetSettings = badgesApi.setSettings as jest.Mock
const mockCreateDefinition = badgesApi.createDefinition as jest.Mock
const mockUpdateDefinition = badgesApi.updateDefinition as jest.Mock
const mockDeleteDefinition = badgesApi.deleteDefinition as jest.Mock
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
    mockCreateAward.mockImplementation(() => ok(null))
    mockAdvanceAward.mockImplementation(() => ok(null))
    mockDeleteAward.mockImplementation(() => ok(null))
    mockAddEvidence.mockImplementation(() => ok(null))
    mockRemoveEvidence.mockImplementation(() => ok(null))
    mockSetSettings.mockImplementation(() => ok({ householdId: 'hh_fix_001', platformBadgesEnabled: false }))
    mockCreateDefinition.mockImplementation(() => ok(null))
    mockUpdateDefinition.mockImplementation(() => ok(null))
    mockDeleteDefinition.mockImplementation(() => ok(null))
  })

  afterEach(() => {
    mockUseHousehold.mockReset()
    mockUseLearner.mockReset()
    mockGetCollection.mockReset()
    mockGetSettings.mockReset()
    mockCreateAward.mockReset()
    mockAdvanceAward.mockReset()
    mockDeleteAward.mockReset()
    mockAddEvidence.mockReset()
    mockRemoveEvidence.mockReset()
    mockSetSettings.mockReset()
    mockCreateDefinition.mockReset()
    mockUpdateDefinition.mockReset()
    mockDeleteDefinition.mockReset()
  })

  it('shows loading state initially', () => {
    mockGetCollection.mockImplementation(() => new Promise(() => {}))
    render(<BadgesPage />)
    expect(screen.getByTestId('badges-loading')).toBeInTheDocument()
  })

  it('prompts to select a learner instead of erroring when none is selected', async () => {
    mockUseLearner.mockImplementation(() => ({ selectedChildId: null, setSelectedChildId: jest.fn() }))
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badges-no-learner')).toBeInTheDocument()
    })
    expect(mockGetCollection).not.toHaveBeenCalled()
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

  // ─── Phase 3: award lifecycle / evidence / settings interactions ──────────
  it('starts an award on a badge with no award yet', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('start-award-badge_fix_003')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('start-award-badge_fix_003'))
    await waitFor(() => expect(mockCreateAward).toHaveBeenCalledWith('student_seed_layth_001', 'badge_fix_003'))
    await waitFor(() => expect(screen.getByText('Award started')).toBeInTheDocument())
  })

  it('advances an in-progress award', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-locked-badge_fix_002')).toBeInTheDocument())
    const card = within(screen.getByTestId('badge-locked-badge_fix_002'))
    fireEvent.click(card.getByRole('button', { name: 'Verify' }))
    await waitFor(() => expect(mockAdvanceAward).toHaveBeenCalledWith('award_fix_002', 'verified'))
  })

  it('revokes an award through the styled confirmation (confirm path)', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-earned-badge_fix_001')).toBeInTheDocument())
    const card = within(screen.getByTestId('badge-earned-badge_fix_001'))
    fireEvent.click(card.getByRole('button', { name: 'Remove award' }))
    await waitFor(() => expect(screen.getByText('Remove this award?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }))
    await waitFor(() => expect(mockDeleteAward).toHaveBeenCalledWith('award_fix_001'))
  })

  it('cancels an award revoke without calling the API', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-earned-badge_fix_001')).toBeInTheDocument())
    const card = within(screen.getByTestId('badge-earned-badge_fix_001'))
    fireEvent.click(card.getByRole('button', { name: 'Remove award' }))
    await waitFor(() => expect(screen.getByText('Remove this award?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Remove this award?')).not.toBeInTheDocument())
    expect(mockDeleteAward).not.toHaveBeenCalled()
  })

  it('links evidence to an award', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-locked-badge_fix_002')).toBeInTheDocument())
    const card = within(screen.getByTestId('badge-locked-badge_fix_002'))
    fireEvent.click(card.getByRole('button', { name: /add evidence/i }))
    fireEvent.change(card.getByLabelText('Evidence ID'), { target: { value: 'ev_new' } })
    fireEvent.click(card.getByRole('button', { name: 'Link evidence' }))
    await waitFor(() => expect(mockAddEvidence).toHaveBeenCalledWith('award_fix_002', 'ev_new'))
  })

  it('evidence row and card stay overflow-safe on narrow (2-col) layouts', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-locked-badge_fix_002')).toBeInTheDocument())
    const cardEl = screen.getByTestId('badge-locked-badge_fix_002')
    expect(cardEl.className).toMatch(/\bmin-w-0\b/)
    const card = within(cardEl)
    fireEvent.click(card.getByRole('button', { name: /add evidence/i }))
    const linkButton = card.getByRole('button', { name: 'Link evidence' })
    expect(linkButton.className).toMatch(/\bshrink-0\b/)
    expect(linkButton.className).toMatch(/\bwhitespace-nowrap\b/)
    expect(card.getByLabelText('Evidence ID').className).toMatch(/\bmin-w-0\b/)
  })

  it('unlinks evidence from an award', async () => {
    mockGetCollection.mockImplementation(() => ok([
      {
        definition: mockBadgeCollection[1].definition,
        award: {
          ...mockBadgeCollection[1].award,
          evidence: [{ id: 'bae_1', evidenceId: 'ev_fix_003' }],
        },
        isEarned: false,
      },
    ]))
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-locked-badge_fix_002')).toBeInTheDocument())
    const card = within(screen.getByTestId('badge-locked-badge_fix_002'))
    fireEvent.click(card.getByRole('button', { name: 'Unlink evidence' }))
    await waitFor(() => expect(mockRemoveEvidence).toHaveBeenCalledWith('award_fix_002', 'bae_1'))
  })

  it('toggles the platform-badges setting', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByLabelText('Platform badges enabled')).toBeInTheDocument())
    fireEvent.click(screen.getByLabelText('Platform badges enabled'))
    await waitFor(() => expect(mockSetSettings).toHaveBeenCalledWith(false))
  })

  // ─── G5: 'Add badge' discoverability ───────────────────────────────────────
  it('shows a clearly labeled "Add badge" control in the list header that reveals the create form', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badges-trophy-case')).toBeInTheDocument())
    const addButton = screen.getByRole('button', { name: 'Add badge' })
    expect(addButton).toBeInTheDocument()
    expect(screen.queryByTestId('create-badge-form')).not.toBeInTheDocument()
    fireEvent.click(addButton)
    await waitFor(() => expect(screen.getByTestId('create-badge-form')).toBeInTheDocument())
    expect(screen.getByText(/custom to your household/i)).toBeInTheDocument()
    expect(addButton).toHaveTextContent('Cancel')
  })

  it('shows the "Add badge" control even when the badge collection is empty', async () => {
    mockGetCollection.mockImplementation(() => ok([]))
    render(<BadgesPage />)
    await waitFor(() => {
      expect(screen.getByTestId('badges-empty')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Add badge' })).toBeInTheDocument()
    })
  })

  // ─── Phase 5: custom badge authoring ──────────────────────────────────────
  it('authors a custom badge via the create form', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add badge' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Add badge' }))
    await waitFor(() => expect(screen.getByTestId('create-badge-form')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Badge title'), { target: { value: 'Tajweed Star' } })
    fireEvent.change(screen.getByLabelText('Badge description'), { target: { value: 'Master tajweed' } })
    fireEvent.change(screen.getByLabelText('Badge criteria'), { target: { value: 'Recite with tajweed' } })
    fireEvent.change(screen.getByLabelText('Badge emblem key'), { target: { value: 'tajweed-star' } })
    fireEvent.click(within(screen.getByTestId('create-badge-form')).getByRole('button', { name: 'Create badge' }))
    await waitFor(() => expect(mockCreateDefinition).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Tajweed Star', emblemKey: 'tajweed-star', visibility: 'household',
    })))
    await waitFor(() => expect(screen.getByText('Badge created')).toBeInTheDocument())
  })

  it('shows edit/delete only on household-owned (custom) badges, not starters', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-locked-badge_fix_003')).toBeInTheDocument())
    // Custom badge (badge_fix_003) is editable
    expect(within(screen.getByTestId('badge-locked-badge_fix_003')).getByRole('button', { name: 'Edit badge' })).toBeInTheDocument()
    // Starter badge (badge_fix_001) is not
    expect(within(screen.getByTestId('badge-earned-badge_fix_001')).queryByRole('button', { name: 'Edit badge' })).not.toBeInTheDocument()
  })

  it('edits a custom badge', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-locked-badge_fix_003')).toBeInTheDocument())
    fireEvent.click(within(screen.getByTestId('badge-locked-badge_fix_003')).getByRole('button', { name: 'Edit badge' }))
    await waitFor(() => expect(screen.getByTestId('badge-editing-badge_fix_003')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Badge title'), { target: { value: 'Arabic Ace' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(mockUpdateDefinition).toHaveBeenCalledWith('badge_fix_003', expect.objectContaining({ title: 'Arabic Ace' })))
  })

  it('deletes a custom badge through the styled confirmation', async () => {
    render(<BadgesPage />)
    await waitFor(() => expect(screen.getByTestId('badge-locked-badge_fix_003')).toBeInTheDocument())
    fireEvent.click(within(screen.getByTestId('badge-locked-badge_fix_003')).getByRole('button', { name: 'Delete badge' }))
    await waitFor(() => expect(screen.getByText('Delete this badge?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteDefinition).toHaveBeenCalledWith('badge_fix_003'))
  })
})

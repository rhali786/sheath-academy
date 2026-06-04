import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { FeedbackHubPage } from '@/features/feedback/front/pages/FeedbackHubPage'
import type { FeedbackRow } from '@/features/feedback/types'

jest.mock('@/features/feedback/front/services/api', () => ({
  listUserFeedback: jest.fn(),
}))
jest.mock('next/link', () =>
  function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
)
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

import { listUserFeedback } from '@/features/feedback/front/services/api'
import { useSession } from 'next-auth/react'

const mockList = listUserFeedback as jest.Mock
const mockUseSession = useSession as jest.Mock

const makeRow = (overrides: Partial<FeedbackRow> = {}): FeedbackRow => ({
  id: 'fb_1',
  userId: 'user_1',
  householdId: 'hh_1',
  householdName: 'Barakah Academy',
  userEmail: 'parent@example.com',
  pagePath: '/dashboard',
  sentiment: 'good',
  message: 'Dashboard works great',
  status: 'reviewed',
  featureArea: 'dashboard',
  feedbackType: 'enhancement',
  riskLevel: 'low',
  confidence: 'high',
  duplicateOfFeedbackId: null,
  adminApprovedAt: null,
  adminApprovedByUserId: null,
  prNumber: null,
  previewUrl: null,
  uatInstructions: null,
  versionResolved: null,
  resolvedAt: null,
  changelogVersion: null,
  changelogLabel: null,
  changelogUserCredit: null,
  createdAt: '2026-05-25T10:00:00Z',
  ...overrides,
})

const sessionUser = (isAdmin: boolean) => ({
  data: { user: { email: 'parent@example.com', isAdmin } },
  status: 'authenticated',
})

beforeEach(() => {
  mockUseSession.mockImplementation(() => sessionUser(false))
  mockList.mockReset()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('FeedbackHubPage', () => {
  it('shows loading skeleton while fetching', () => {
    mockList.mockReturnValue(new Promise(() => {}))
    const { container } = render(<FeedbackHubPage />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    mockList.mockRejectedValue(new Error('Failed to load feedback'))
    render(<FeedbackHubPage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load feedback/i)).toBeInTheDocument()
    })
  })

  it('shows empty state when no feedback exists', async () => {
    mockList.mockResolvedValue([])
    render(<FeedbackHubPage />)
    await waitFor(() => {
      expect(screen.getByText(/no feedback submitted yet/i)).toBeInTheDocument()
    })
  })

  describe('non-admin user', () => {
    beforeEach(() => {
      mockUseSession.mockImplementation(() => sessionUser(false))
    })

    it('renders "My feedback" title', async () => {
      mockList.mockResolvedValue([makeRow()])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText('My feedback')).toBeInTheDocument()
      })
    })

    it('does not show submitter email on rows', async () => {
      mockList.mockResolvedValue([makeRow({ userEmail: 'parent@example.com' })])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText('/dashboard')).toBeInTheDocument()
      })
      expect(screen.queryByText('parent@example.com')).not.toBeInTheDocument()
    })
  })

  describe('admin user', () => {
    beforeEach(() => {
      mockUseSession.mockImplementation(() => sessionUser(true))
    })

    it('renders "All feedback" title', async () => {
      mockList.mockResolvedValue([makeRow()])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText('All feedback')).toBeInTheDocument()
      })
    })

    it('shows submitter email on each row', async () => {
      mockList.mockResolvedValue([makeRow({ userEmail: 'rhali786@gmail.com' })])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText(/rhali786@gmail\.com/)).toBeInTheDocument()
      })
    })

    it('shows household name alongside submitter email', async () => {
      mockList.mockResolvedValue([makeRow({ householdName: 'Ali Kids Household', userEmail: 'rhali786@gmail.com' })])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText(/Ali Kids Household/)).toBeInTheDocument()
      })
    })

    it('shows rows from multiple submitters', async () => {
      const rows = [
        makeRow({ id: 'fb_1', userEmail: 'parent@example.com', householdName: 'Barakah Academy' }),
        makeRow({ id: 'fb_2', userEmail: 'rhali786@gmail.com', householdName: 'Ali Kids Household', pagePath: '/lessons' }),
      ]
      mockList.mockResolvedValue(rows)
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText(/parent@example\.com/)).toBeInTheDocument()
        expect(screen.getByText(/rhali786@gmail\.com/)).toBeInTheDocument()
      })
    })
  })

  describe('shared row content', () => {
    beforeEach(() => {
      mockUseSession.mockImplementation(() => sessionUser(false))
    })

    it('renders sentiment emoji and page path', async () => {
      mockList.mockResolvedValue([makeRow()])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText('🙂')).toBeInTheDocument()
        expect(screen.getByText('/dashboard')).toBeInTheDocument()
      })
    })

    it('renders status badge', async () => {
      mockList.mockResolvedValue([makeRow({ status: 'reviewed' })])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText('reviewed')).toBeInTheDocument()
      })
    })

    it('each row links to its detail page', async () => {
      mockList.mockResolvedValue([makeRow({ id: 'fb_abc' })])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        const links = screen.getAllByRole('link')
        expect(links.map(l => l.getAttribute('href'))).toContain('/feedback/fb_abc')
      })
    })

    it('shows PR number badge when prNumber is set', async () => {
      mockList.mockResolvedValue([makeRow({ prNumber: 42 })])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText('PR #42')).toBeInTheDocument()
      })
    })

    it('shows version badge when versionResolved is set', async () => {
      mockList.mockResolvedValue([makeRow({ versionResolved: '1.4.2' })])
      render(<FeedbackHubPage />)
      await waitFor(() => {
        expect(screen.getByText('v1.4.2')).toBeInTheDocument()
      })
    })
  })
})

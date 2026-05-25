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

import { listUserFeedback } from '@/features/feedback/front/services/api'
const mockList = listUserFeedback as jest.Mock

const mockRows: FeedbackRow[] = [
  {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
    userEmail: 'parent@example.com',
    pagePath: '/dashboard',
    sentiment: 'good',
    message: 'Dashboard works great',
    status: 'classified',
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
    updatedAt: '2026-05-25T10:00:00Z',
  },
  {
    id: 'fb_2',
    userId: 'user_1',
    householdId: 'hh_1',
    userEmail: 'parent@example.com',
    pagePath: '/lessons',
    sentiment: 'poor',
    message: 'Lessons page is confusing',
    status: 'submitted',
    featureArea: null,
    feedbackType: 'bug',
    riskLevel: null,
    confidence: null,
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
    createdAt: '2026-05-24T10:00:00Z',
    updatedAt: '2026-05-24T10:00:00Z',
  },
]

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

  it('renders page title and feedback count', async () => {
    mockList.mockResolvedValue(mockRows)
    render(<FeedbackHubPage />)
    await waitFor(() => {
      expect(screen.getByText('My feedback')).toBeInTheDocument()
      expect(screen.getByText('2 items')).toBeInTheDocument()
    })
  })

  it('renders each feedback item with sentiment emoji and page path', async () => {
    mockList.mockResolvedValue(mockRows)
    render(<FeedbackHubPage />)
    await waitFor(() => {
      expect(screen.getByText('🙂')).toBeInTheDocument()
      expect(screen.getByText('😕')).toBeInTheDocument()
      expect(screen.getByText('/dashboard')).toBeInTheDocument()
      expect(screen.getByText('/lessons')).toBeInTheDocument()
    })
  })

  it('renders status badge for each feedback item', async () => {
    mockList.mockResolvedValue(mockRows)
    render(<FeedbackHubPage />)
    await waitFor(() => {
      expect(screen.getByText('classified')).toBeInTheDocument()
      expect(screen.getByText('submitted')).toBeInTheDocument()
    })
  })

  it('each feedback item links to its detail page', async () => {
    mockList.mockResolvedValue(mockRows)
    render(<FeedbackHubPage />)
    await waitFor(() => {
      const links = screen.getAllByRole('link')
      const hrefs = links.map(l => l.getAttribute('href'))
      expect(hrefs).toContain('/feedback/fb_1')
      expect(hrefs).toContain('/feedback/fb_2')
    })
  })

  it('shows message preview when present', async () => {
    mockList.mockResolvedValue(mockRows)
    render(<FeedbackHubPage />)
    await waitFor(() => {
      expect(screen.getByText('Dashboard works great')).toBeInTheDocument()
    })
  })
})

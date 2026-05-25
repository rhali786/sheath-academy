import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { FeedbackDetailPage } from '@/features/feedback/front/pages/FeedbackDetailPage'
import type { FeedbackRow } from '@/features/feedback/types'

jest.mock('@/features/feedback/front/services/api', () => ({
  getUserFeedback: jest.fn(),
}))
jest.mock('next/link', () =>
  function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
)

import { getUserFeedback } from '@/features/feedback/front/services/api'
const mockGet = getUserFeedback as jest.Mock

const mockRow: FeedbackRow = {
  id: 'fb_1',
  userId: 'user_1',
  householdId: 'hh_1',
  userEmail: 'parent@example.com',
  pagePath: '/dashboard',
  sentiment: 'good',
  message: 'Dashboard works great',
  status: 'in_pr',
  featureArea: 'dashboard',
  feedbackType: 'enhancement',
  riskLevel: 'low',
  confidence: 'high',
  duplicateOfFeedbackId: null,
  adminApprovedAt: '2026-05-25T10:00:00Z',
  adminApprovedByUserId: 'admin@example.com',
  prNumber: 42,
  previewUrl: 'https://preview.example.com',
  uatInstructions: 'Test in staging environment',
  versionResolved: null,
  resolvedAt: null,
  changelogVersion: null,
  changelogLabel: null,
  changelogUserCredit: null,
  createdAt: '2026-05-24T10:00:00Z',
  updatedAt: '2026-05-25T10:00:00Z',
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('FeedbackDetailPage', () => {
  it('shows loading skeleton while fetching', () => {
    mockGet.mockReturnValue(new Promise(() => {}))
    const { container } = render(<FeedbackDetailPage id="fb_1" />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('shows error state when fetch fails', async () => {
    mockGet.mockRejectedValue(new Error('Not found'))
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument()
    })
  })

  it('renders page title and back link', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('Feedback detail')).toBeInTheDocument()
      const backLink = screen.getByRole('link', { name: /back/i })
      expect(backLink).toHaveAttribute('href', '/feedback')
    })
  })

  it('displays sentiment emoji and page path', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('🙂')).toBeInTheDocument()
      expect(screen.getByText('/dashboard')).toBeInTheDocument()
    })
  })

  it('displays status badge', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('in pr')).toBeInTheDocument()
    })
  })

  it('displays the feedback message', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('Dashboard works great')).toBeInTheDocument()
    })
  })

  it('displays PR info with preview link when in PR', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText(/PR #42/)).toBeInTheDocument()
      const previewLink = screen.getByRole('link', { name: /preview/i })
      expect(previewLink).toHaveAttribute('href', 'https://preview.example.com')
    })
  })

  it('displays UAT instructions when present', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('Test in staging environment')).toBeInTheDocument()
    })
  })

  it('shows shipped state when versionResolved is set', async () => {
    mockGet.mockResolvedValue({ ...mockRow, versionResolved: '2.1.0', status: 'shipped' as const })
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText(/2\.1\.0/)).toBeInTheDocument()
    })
  })

  it('calls getUserFeedback with the given id', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('fb_1')
    })
  })
})

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
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

import { getUserFeedback } from '@/features/feedback/front/services/api'
import { useSession } from 'next-auth/react'
const mockGet = getUserFeedback as jest.Mock
const mockUseSession = useSession as jest.Mock

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
  recommendation: 'Clarify the dashboard button label.',
  duplicateOfFeedbackId: null,
  adminApprovedAt: '2026-05-25T10:00:00Z',
  adminApprovedByUserId: 'admin@example.com',
  prNumber: 42,
  previewUrl: 'https://preview.example.com',
  uatInstructions: 'Test in staging environment',
  versionResolved: null,
  resolvedAt: null,
  changelogEntryId: null,
  createdAt: '2026-05-24T10:00:00Z',
}

afterEach(() => {
  jest.clearAllMocks()
})

beforeEach(() => {
  mockUseSession.mockReturnValue({
    data: { user: { email: 'parent@example.com', isAdmin: false } },
    status: 'authenticated',
  })
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
      expect(screen.getByText('Good 🙂')).toBeInTheDocument()
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

  it('shows Claude recommendation to admins reviewing the row', async () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'admin@example.com', isAdmin: true } },
      status: 'authenticated',
    })
    mockGet.mockResolvedValue({
      ...mockRow,
      status: 'awaiting_approval',
      recommendation: 'Break this into a lower-risk dashboard copy change before planning.',
    })
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('Claude recommendation')).toBeInTheDocument()
      expect(screen.getByText('Break this into a lower-risk dashboard copy change before planning.')).toBeInTheDocument()
    })
  })

  it('shows shipped state when versionResolved is set', async () => {
    mockGet.mockResolvedValue({ ...mockRow, versionResolved: '2.1.0', status: 'shipped' as const })
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText(/2\.1\.0/)).toBeInTheDocument()
    })
  })

  it('shows changelog label when present on a shipped row', async () => {
    mockGet.mockResolvedValue({
      ...mockRow,
      status: 'shipped' as const,
      versionResolved: '2.1.0',
      changelogEntryId: 'cl_1',
      changelogEntryLabel: 'Dashboard copy polish',
    })
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('Dashboard copy polish')).toBeInTheDocument()
    })
  })

  it('shows changelog user credit when present', async () => {
    mockGet.mockResolvedValue({
      ...mockRow,
      status: 'shipped' as const,
      versionResolved: '2.1.0',
      changelogEntryId: 'cl_1',
      changelogEntryLabel: 'Dashboard copy polish',
      changelogEntryUserCredit: 'parent@example.com',
    })
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('Credit')).toBeInTheDocument()
      expect(screen.getByText('parent@example.com')).toBeInTheDocument()
    })
  })

  it('shows the attached screenshot when hasScreenshot is true', async () => {
    mockGet.mockResolvedValue({ ...mockRow, hasScreenshot: true })
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      const img = screen.getByTestId('feedback-screenshot-image')
      expect(img).toHaveAttribute('src', '/api/feedback/fb_1/screenshot')
    })
  })

  it('does not show a screenshot section when hasScreenshot is false', async () => {
    mockGet.mockResolvedValue({ ...mockRow, hasScreenshot: false })
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(screen.getByText('Feedback detail')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('feedback-screenshot-image')).not.toBeInTheDocument()
  })

  it('calls getUserFeedback with the given id', async () => {
    mockGet.mockResolvedValue(mockRow)
    render(<FeedbackDetailPage id="fb_1" />)
    await waitFor(() => {
      expect(mockGet).toHaveBeenCalledWith('fb_1')
    })
  })
})

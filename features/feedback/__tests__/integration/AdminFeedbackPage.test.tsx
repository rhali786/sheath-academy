import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminFeedbackPage } from '@/features/feedback/front/pages/AdminFeedbackPage'
import type { FeedbackRow } from '@/features/feedback/types'

jest.mock('next/link', () =>
  function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>
  }
)

const mockFetch = jest.fn()
beforeEach(() => {
  jest.resetAllMocks()
  window.fetch = mockFetch
})

const makeRow = (overrides: Partial<FeedbackRow> = {}): FeedbackRow => ({
  id: 'fb_1',
  userId: 'user_1',
  householdId: 'hh_1',
  householdName: 'Barakah Academy',
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
  ...overrides,
})

const mockOk = (data: unknown) => ({
  ok: true,
  status: 200,
  json: async () => data,
})

describe('AdminFeedbackPage', () => {
  it('renders loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    const { container } = render(<AdminFeedbackPage />)
    expect(container.querySelector('.animate-pulse')).toBeInTheDocument()
  })

  it('renders error state when fetch fails', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'))
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load feedback/i)).toBeInTheDocument()
    })
  })

  it('renders empty state when no feedback', async () => {
    mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [] }))
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText(/no feedback found/i)).toBeInTheDocument()
    })
  })

  it('shows feedback count', async () => {
    const rows = [makeRow(), makeRow({ id: 'fb_2', status: 'submitted' })]
    mockFetch.mockResolvedValue(mockOk({ status: 'success', data: rows }))
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText('2 feedback items')).toBeInTheDocument()
    })
  })

  describe('submitter info', () => {
    it('shows user email on each card', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow({ userEmail: 'rhali786@gmail.com' })] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.getByText('rhali786@gmail.com')).toBeInTheDocument()
      })
    })

    it('shows household name alongside email', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow({ householdName: 'Ali Kids Household' })] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.getByText(/Ali Kids Household/)).toBeInTheDocument()
      })
    })

    it('omits household separator when householdName is null', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow({ householdName: null, userEmail: 'a@b.com' })] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.getByText('a@b.com')).toBeInTheDocument()
        expect(screen.queryByText(/· null/)).not.toBeInTheDocument()
      })
    })

    it('renders "View detail" link pointing to /feedback/:id', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow({ id: 'fb_xyz' })] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        const link = screen.getByRole('link', { name: /view detail/i })
        expect(link).toHaveAttribute('href', '/feedback/fb_xyz')
      })
    })
  })

  describe('feedback card content', () => {
    it('renders sentiment emoji and page path', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow()] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.getByText('🙂')).toBeInTheDocument()
        expect(screen.getByText('/dashboard')).toBeInTheDocument()
      })
    })

    it('renders metadata badges', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow()] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.getByText('enhancement')).toBeInTheDocument()
        expect(screen.getByText('dashboard')).toBeInTheDocument()
        expect(screen.getByText('Confidence: high')).toBeInTheDocument()
        expect(screen.getByText('Risk: low')).toBeInTheDocument()
      })
    })

    it('shows UAT instructions in collapsible details', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow({ uatInstructions: 'Test in staging' })] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        const summary = screen.getByText('UAT Instructions')
        fireEvent.click(summary)
        expect(screen.getByText('Test in staging')).toBeInTheDocument()
      })
    })
  })

  describe('approval flow', () => {
    it('shows approve button only for awaiting_approval rows', async () => {
      const rows = [
        makeRow({ id: 'fb_waiting', status: 'awaiting_approval' }),
        makeRow({ id: 'fb_classified', status: 'classified' }),
        makeRow({ id: 'fb_submitted', status: 'submitted' }),
      ]
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: rows }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.getByTestId('approve-button-fb_waiting')).toBeInTheDocument()
        expect(screen.queryByTestId('approve-button-fb_classified')).not.toBeInTheDocument()
        expect(screen.queryByTestId('approve-button-fb_submitted')).not.toBeInTheDocument()
      })
    })

    it('does not show approve button for shipped, in_pr, or in_qa rows', async () => {
      const rows = [
        makeRow({ id: 'fb_shipped', status: 'shipped' }),
        makeRow({ id: 'fb_in_pr', status: 'in_pr' }),
        makeRow({ id: 'fb_in_qa', status: 'in_qa' }),
      ]
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: rows }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.queryByTestId('approve-button-fb_shipped')).not.toBeInTheDocument()
        expect(screen.queryByTestId('approve-button-fb_in_pr')).not.toBeInTheDocument()
        expect(screen.queryByTestId('approve-button-fb_in_qa')).not.toBeInTheDocument()
      })
    })

    it('opens approval modal when approve clicked', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow({ id: 'fb_1', status: 'awaiting_approval' })] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => screen.getByTestId('approve-button-fb_1'))
      fireEvent.click(screen.getByTestId('approve-button-fb_1'))
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('closes modal on cancel', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [makeRow({ id: 'fb_1', status: 'awaiting_approval' })] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => screen.getByTestId('approve-button-fb_1'))
      fireEvent.click(screen.getByTestId('approve-button-fb_1'))
      await waitFor(() => screen.getByRole('dialog'))
      fireEvent.click(screen.getByRole('button', { name: /cancel/i }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('calls approve endpoint and closes modal on confirm', async () => {
      mockFetch
        .mockResolvedValueOnce(mockOk({ status: 'success', data: [makeRow({ id: 'fb_1', status: 'awaiting_approval' })] }))
        .mockResolvedValueOnce(mockOk({ status: 'success', data: null }))
      render(<AdminFeedbackPage />)
      await waitFor(() => screen.getByTestId('approve-button-fb_1'))
      fireEvent.click(screen.getByTestId('approve-button-fb_1'))
      await waitFor(() => screen.getByRole('dialog'))
      fireEvent.click(screen.getByRole('button', { name: /^Approve$/i }))
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/admin/feedback/fb_1/approve', { method: 'POST' })
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('optimistic update shows classified badge after approval', async () => {
      mockFetch
        .mockResolvedValueOnce(mockOk({ status: 'success', data: [makeRow({ id: 'fb_1', status: 'awaiting_approval' })] }))
        .mockResolvedValueOnce(mockOk({ status: 'success', data: null }))
      render(<AdminFeedbackPage />)
      await waitFor(() => screen.getByTestId('approve-button-fb_1'))
      fireEvent.click(screen.getByTestId('approve-button-fb_1'))
      await waitFor(() => screen.getByRole('dialog'))
      fireEvent.click(screen.getByRole('button', { name: /^Approve$/i }))
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
        expect(screen.getByText('classified')).toBeInTheDocument()
      })
    })
  })

  describe('shipped rows', () => {
    it('shows versionResolved badge on shipped cards', async () => {
      mockFetch.mockResolvedValue(mockOk({
        status: 'success',
        data: [makeRow({ id: 'fb_1', status: 'shipped', versionResolved: '2.1.0' })],
      }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.getByText('v2.1.0')).toBeInTheDocument()
      })
    })

    it('does not show versionResolved badge when absent', async () => {
      mockFetch.mockResolvedValue(mockOk({
        status: 'success',
        data: [makeRow({ id: 'fb_1', status: 'classified', versionResolved: null })],
      }))
      render(<AdminFeedbackPage />)
      await waitFor(() => {
        expect(screen.queryByText(/^v\d/)).not.toBeInTheDocument()
      })
    })
  })

  describe('filters', () => {
    it('sends status filter param on change', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => screen.getByTestId('filter-status'))
      fireEvent.change(screen.getByTestId('filter-status'), { target: { value: 'classified' } })
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('status=classified'))
      })
    })

    it('sends featureArea filter param on change', async () => {
      mockFetch.mockResolvedValue(mockOk({ status: 'success', data: [] }))
      render(<AdminFeedbackPage />)
      await waitFor(() => screen.getByTestId('filter-feature-area'))
      fireEvent.change(screen.getByTestId('filter-feature-area'), { target: { value: 'dashboard' } })
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('featureArea=dashboard'))
      })
    })
  })
})

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminFeedbackPage } from '@/features/feedback/front/pages/AdminFeedbackPage'
import type { FeedbackRow } from '@/features/feedback/types'

const mockFeedbackRows: FeedbackRow[] = [
  {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
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
    uatInstructions: 'Test in staging',
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
    userId: 'user_2',
    householdId: 'hh_1',
    pagePath: '/lessons',
    sentiment: 'poor',
    message: 'Lessons page is confusing',
    status: 'submitted',
    featureArea: 'lessons',
    feedbackType: 'bug',
    riskLevel: 'medium',
    confidence: 'medium',
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

// Mock window.fetch
const mockFetch = jest.fn()
beforeEach(() => {
  jest.resetAllMocks()
  window.fetch = mockFetch
})

// Helper to create mock response
const mockResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: async () => data,
})

describe('AdminFeedbackPage', () => {
  it('renders loading state', () => {
    mockFetch.mockImplementationOnce(() => new Promise(() => {}))
    const { container } = render(<AdminFeedbackPage />)
    const pulse = container.querySelector('.animate-pulse')
    expect(pulse).toBeInTheDocument()
  })

  it('renders empty state when no feedback found', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: [], message: 'No feedback' })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText(/no feedback found/i)).toBeInTheDocument()
    })
  })

  it('renders feedback items when data is loaded', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText('Dashboard works great')).toBeInTheDocument()
      expect(screen.getByText('Lessons page is confusing')).toBeInTheDocument()
    })
  })

  it('displays feedback items with sentiment emoji', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText('🙂')).toBeInTheDocument() // good sentiment
      expect(screen.getByText('😕')).toBeInTheDocument() // poor sentiment
    })
  })

  it('displays metadata badges (type, area, confidence, risk)', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText('enhancement')).toBeInTheDocument()
      expect(screen.getByText('dashboard')).toBeInTheDocument()
      expect(screen.getAllByText('Confidence: high')).toHaveLength(1)
      expect(screen.getByText('Risk: low')).toBeInTheDocument()
    })
  })

  it('shows UAT instructions in collapsible details', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      const summary = screen.getByText('UAT Instructions')
      expect(summary).toBeInTheDocument()
      fireEvent.click(summary)
      expect(screen.getByText('Test in staging')).toBeInTheDocument()
    })
  })

  it('shows approve button only for classified status without approval', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByTestId('approve-button-fb_1')).toBeInTheDocument()
      expect(screen.queryByTestId('approve-button-fb_2')).not.toBeInTheDocument()
    })
  })

  it('opens approval modal when approve button clicked', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByTestId('approve-button-fb_1')).toBeInTheDocument()
    })

    const approveButton = screen.getByTestId('approve-button-fb_1')
    fireEvent.click(approveButton)

    await waitFor(() => {
      expect(screen.getByText('Approve feedback')).toBeInTheDocument()
      const dialog = screen.getByRole('dialog')
      expect(dialog).toBeInTheDocument()
      expect(dialog.textContent).toContain('Dashboard works great')
    })
  })

  it('closes modal when cancel button clicked', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      const approveButton = screen.getByTestId('approve-button-fb_1')
      fireEvent.click(approveButton)
    })
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    await waitFor(() => {
      expect(screen.queryByText('Approve feedback')).not.toBeInTheDocument()
    })
  })

  it('approves feedback when confirmed', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByTestId('approve-button-fb_1')).toBeInTheDocument()
    })

    // Approve
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: null })
    )
    const approveButton = screen.getByTestId('approve-button-fb_1')
    fireEvent.click(approveButton)
    const confirmButton = screen.getByRole('button', { name: /^Approve$/i })
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/admin/feedback/fb_1/approve', { method: 'POST' })
      expect(screen.queryByText('Approve feedback')).not.toBeInTheDocument()
    })
  })

  it('filters feedback by status', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByTestId('filter-status')).toBeInTheDocument()
    })

    const statusFilter = screen.getByTestId('filter-status') as HTMLSelectElement
    fireEvent.change(statusFilter, { target: { value: 'classified' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('status=classified'))
    })
  })

  it('filters feedback by feature area', async () => {
    mockFetch.mockResolvedValue(
      mockResponse({ status: 'success', data: [mockFeedbackRows[0]] })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByTestId('filter-feature-area')).toBeInTheDocument()
    })

    const featureAreaInput = screen.getByTestId('filter-feature-area') as HTMLInputElement
    fireEvent.change(featureAreaInput, { target: { value: 'dashboard' } })

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('featureArea=dashboard'))
    })
  })

  it('renders error state when fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText(/failed to load feedback/i)).toBeInTheDocument()
    })
  })

  it('displays feedback count', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse({ status: 'success', data: mockFeedbackRows })
    )
    render(<AdminFeedbackPage />)
    await waitFor(() => {
      expect(screen.getByText('2 feedback items')).toBeInTheDocument()
    })
  })
})


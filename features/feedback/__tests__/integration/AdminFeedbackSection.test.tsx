import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AdminFeedbackSection } from '@/features/feedback/front/components/AdminFeedbackSection'

jest.mock('@/features/feedback/front/services/api', () => ({
  listAdminFeedback: jest.fn(),
}))

import { listAdminFeedback } from '@/features/feedback/front/services/api'
const mockList = listAdminFeedback as jest.Mock

const row = {
  id: 'fb_01',
  userId: 'user_01',
  householdId: 'hh_01',
  userEmail: 'parent@example.com',
  pagePath: '/dashboard',
  sentiment: 'great' as const,
  message: 'Works great!',
  createdAt: '2026-05-24T10:00:00Z',
}

afterEach(() => {
  jest.clearAllMocks()
})

describe('AdminFeedbackSection', () => {
  it('shows loading state initially', () => {
    mockList.mockReturnValue(new Promise(() => {}))
    render(<AdminFeedbackSection />)
    expect(screen.getByTestId('admin-feedback-loading')).toBeInTheDocument()
  })

  it('shows empty state when no feedback exists', async () => {
    mockList.mockResolvedValue([])
    render(<AdminFeedbackSection />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-feedback-empty')).toBeInTheDocument()
    })
  })

  it('renders table with feedback rows', async () => {
    mockList.mockResolvedValue([row])
    render(<AdminFeedbackSection />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-feedback-table')).toBeInTheDocument()
    })
    expect(screen.getByText('parent@example.com')).toBeInTheDocument()
    expect(screen.getByText('/dashboard')).toBeInTheDocument()
    expect(screen.getByText('Works great!')).toBeInTheDocument()
    expect(screen.getAllByText(/great/i).length).toBeGreaterThan(0)
  })

  it('shows a screenshot link when the row has an attached image', async () => {
    mockList.mockResolvedValue([{ ...row, hasScreenshot: true }])
    render(<AdminFeedbackSection />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-feedback-screenshot-link-fb_01')).toHaveAttribute('href', '/feedback/fb_01')
    })
  })

  it('shows no screenshot link when the row has no attached image', async () => {
    mockList.mockResolvedValue([row])
    render(<AdminFeedbackSection />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-feedback-table')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('admin-feedback-screenshot-link-fb_01')).not.toBeInTheDocument()
  })

  it('shows forbidden state on 403', async () => {
    const err = Object.assign(new Error('Forbidden'), { status: 403 })
    mockList.mockRejectedValue(err)
    render(<AdminFeedbackSection />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-feedback-forbidden')).toBeInTheDocument()
    })
  })

  it('shows error state on generic failure', async () => {
    mockList.mockRejectedValue(new Error('Server error'))
    render(<AdminFeedbackSection />)
    await waitFor(() => {
      expect(screen.getByTestId('admin-feedback-error')).toBeInTheDocument()
    })
    expect(screen.getByTestId('admin-feedback-error')).toHaveTextContent('Server error')
  })
})

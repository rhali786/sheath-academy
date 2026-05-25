import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackButton } from '@/features/feedback/front/components/FeedbackButton'

jest.mock('@/features/feedback/front/services/api', () => ({
  submitFeedback: jest.fn(),
}))

import { submitFeedback } from '@/features/feedback/front/services/api'
const mockSubmit = submitFeedback as jest.Mock

beforeEach(() => {
  mockSubmit.mockResolvedValue(undefined)
  Object.defineProperty(window, 'location', {
    value: { pathname: '/dashboard' },
    writable: true,
  })
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('FeedbackButton', () => {
  it('renders only the trigger button when closed', () => {
    render(<FeedbackButton />)
    expect(screen.getByTestId('feedback-trigger')).toBeInTheDocument()
    expect(screen.queryByTestId('feedback-panel')).not.toBeInTheDocument()
  })

  it('opens the panel when trigger is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)
    await user.click(screen.getByTestId('feedback-trigger'))
    expect(screen.getByTestId('feedback-panel')).toBeInTheDocument()
    expect(screen.getByTestId('feedback-submit')).toBeDisabled()
  })

  it('closes the panel when X is clicked', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)
    await user.click(screen.getByTestId('feedback-trigger'))
    await user.click(screen.getByRole('button', { name: /close feedback/i }))
    expect(screen.queryByTestId('feedback-panel')).not.toBeInTheDocument()
  })

  it('enables submit after a sentiment is selected', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)
    await user.click(screen.getByTestId('feedback-trigger'))
    await user.click(screen.getByTestId('sentiment-good'))
    expect(screen.getByTestId('feedback-submit')).not.toBeDisabled()
  })

  it('submits with pagePath and selected sentiment', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)
    await user.click(screen.getByTestId('feedback-trigger'))
    await user.click(screen.getByTestId('sentiment-great'))
    await user.type(screen.getByTestId('feedback-message'), 'Really nice!')
    await user.click(screen.getByTestId('feedback-submit'))
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        pagePath: '/dashboard',
        sentiment: 'great',
        message: 'Really nice!',
      })
    })
  })

  it('shows success state after submission', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)
    await user.click(screen.getByTestId('feedback-trigger'))
    await user.click(screen.getByTestId('sentiment-okay'))
    await user.click(screen.getByTestId('feedback-submit'))
    await waitFor(() => {
      expect(screen.getByTestId('feedback-success')).toBeInTheDocument()
    })
  })

  it('shows error message on API failure', async () => {
    mockSubmit.mockRejectedValue(new Error('Network error'))
    const user = userEvent.setup()
    render(<FeedbackButton />)
    await user.click(screen.getByTestId('feedback-trigger'))
    await user.click(screen.getByTestId('sentiment-bad'))
    await user.click(screen.getByTestId('feedback-submit'))
    await waitFor(() => {
      expect(screen.getByTestId('feedback-error')).toHaveTextContent('Network error')
    })
  })

  it('captures the page path at open time', async () => {
    const user = userEvent.setup()
    render(<FeedbackButton />)
    window.location.pathname = '/lessons'
    await user.click(screen.getByTestId('feedback-trigger'))
    await user.click(screen.getByTestId('sentiment-poor'))
    await user.click(screen.getByTestId('feedback-submit'))
    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ pagePath: '/lessons' }),
      )
    })
  })
})

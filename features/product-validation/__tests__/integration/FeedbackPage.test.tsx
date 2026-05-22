import React from 'react'
import { render, screen } from '@testing-library/react'
import { useSession } from 'next-auth/react'
import { FeedbackPage } from '@/features/product-validation/front/pages/FeedbackPage'

jest.mock('next-auth/react')

const mockUseSession = useSession as jest.Mock

describe('FeedbackPage', () => {
  afterEach(() => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
  })

  it('shows sign-in required when unauthenticated', () => {
    mockUseSession.mockReturnValue({ data: null, status: 'unauthenticated' })
    render(<FeedbackPage />)
    expect(screen.getByTestId('feedback-sign-in-required')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login?callbackUrl=%2Ffeedback',
    )
  })

  it('renders wizard when authenticated', () => {
    mockUseSession.mockReturnValue({
      data: { user: { email: 'parent@test.com' } },
      status: 'authenticated',
    })
    render(<FeedbackPage />)
    expect(screen.getByTestId('product-validation-wizard')).toBeInTheDocument()
  })
})

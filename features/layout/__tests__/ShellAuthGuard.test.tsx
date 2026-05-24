import React from 'react'
import { render, screen } from '@testing-library/react'
import { ShellAuthGuard } from '@/features/layout/front/components/ShellAuthGuard'

const mockReplace = jest.fn()

jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}))

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(() => ({ replace: mockReplace })),
}))

import { useSession } from 'next-auth/react'

const mockUseSession = useSession as jest.Mock

describe('ShellAuthGuard', () => {
  beforeEach(() => {
    mockReplace.mockClear()
  })

  it('shows loading state while session is loading', () => {
    mockUseSession.mockReturnValue({ status: 'loading', data: null })
    render(
      <ShellAuthGuard>
        <p>Protected</p>
      </ShellAuthGuard>,
    )
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('redirects to login when unauthenticated', () => {
    mockUseSession.mockReturnValue({ status: 'unauthenticated', data: null })
    render(
      <ShellAuthGuard>
        <p>Protected</p>
      </ShellAuthGuard>,
    )
    expect(mockReplace).toHaveBeenCalledWith('/login')
    expect(screen.queryByText('Protected')).not.toBeInTheDocument()
  })

  it('renders children when authenticated', () => {
    mockUseSession.mockReturnValue({
      status: 'authenticated',
      data: { user: { email: 'dev@sheathacademy.ai' } },
    })
    render(
      <ShellAuthGuard>
        <p>Protected</p>
      </ShellAuthGuard>,
    )
    expect(screen.getByText('Protected')).toBeInTheDocument()
    expect(mockReplace).not.toHaveBeenCalled()
  })
})

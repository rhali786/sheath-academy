import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import InviteAccept from '@/features/household/front/pages/InviteAccept'

const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockGet = jest.fn()

jest.mock('next/navigation', () => ({
  useSearchParams: () => ({ get: mockGet }),
  useRouter: () => ({ push: mockPush, replace: mockReplace }),
}))

beforeEach(() => {
  jest.resetAllMocks()
  mockGet.mockImplementation((key: string) => (key === 'token' ? 'tok-abc' : null))
  global.fetch = jest.fn()
})

describe('InviteAccept', () => {
  it('renders accepting state while fetch is in flight', async () => {
    ;(global.fetch as jest.Mock).mockImplementation(() => new Promise(() => {}))

    render(<InviteAccept />)

    expect(screen.getByText(/accepting your invitation/i)).toBeInTheDocument()
  })

  it('redirects to /dashboard on success', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'success', data: { householdId: 'h1' } }),
    } as Response)

    render(<InviteAccept />)

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/dashboard')
    })
  })

  it('shows error on 404 (invalid token)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 404,
      json: async () => ({ status: 'error', message: 'Invitation not found' }),
    } as Response)

    render(<InviteAccept />)

    await waitFor(() => {
      expect(screen.getByText(/invitation not found/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument()
  })

  it('shows error on 410 (expired or used token)', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 410,
      json: async () => ({ status: 'error', message: 'Invitation is no longer valid' }),
    } as Response)

    render(<InviteAccept />)

    await waitFor(() => {
      expect(screen.getByText(/no longer valid/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument()
  })

  it('shows error immediately when no token in URL — no fetch made', async () => {
    mockGet.mockReturnValue(null)

    render(<InviteAccept />)

    await waitFor(() => {
      expect(screen.getByText(/invalid or missing invitation link/i)).toBeInTheDocument()
    })
    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('link', { name: /go to login/i })).toBeInTheDocument()
  })
})

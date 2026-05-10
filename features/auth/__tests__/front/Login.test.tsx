import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login, { DevBypassSection } from '@/features/auth/front/pages/Login'

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}))

import { signIn } from 'next-auth/react'
const mockSignIn = signIn as jest.Mock

beforeEach(() => {
  mockSignIn.mockClear()
})

describe('Login page — layout', () => {
  test('renders brand logo and Sheath Academy name', () => {
    render(<Login />)
    expect(screen.getByText('Sheath Academy')).toBeInTheDocument()
  })

  test('renders email input field', () => {
    render(<Login />)
    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument()
  })

  test('renders Send magic link button', () => {
    render(<Login />)
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
  })

  test('renders disabled Google button with coming-soon label', () => {
    render(<Login />)
    const googleButton = screen.getByRole('button', { name: /google/i })
    expect(googleButton).toBeDisabled()
  })

  test('renders disabled Facebook button with coming-soon label', () => {
    render(<Login />)
    const facebookButton = screen.getByRole('button', { name: /facebook/i })
    expect(facebookButton).toBeDisabled()
  })
})

describe('Login page — magic link flow', () => {
  test('submitting a valid email calls signIn with resend provider', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    render(<Login />)

    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'parent@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('resend', {
        email: 'parent@example.com',
        redirect: false,
      })
    })
  })

  test('shows success message after email is submitted', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    render(<Login />)

    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'parent@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  test('shows error message when signIn fails', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'EmailSignin' })
    render(<Login />)

    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'parent@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  test('does not call signIn when email is empty', async () => {
    render(<Login />)
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  test('button shows loading state while submitting', async () => {
    let resolve: (v: unknown) => void
    mockSignIn.mockReturnValue(new Promise((r) => { resolve = r }))
    render(<Login />)

    fireEvent.change(screen.getByRole('textbox', { name: /email/i }), {
      target: { value: 'parent@example.com' },
    })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument()
    resolve!({ ok: true })
  })
})

describe('Login page — dev bypass section hidden by default', () => {
  test('bypass section is not rendered when NEXT_PUBLIC_DEV_MODE is not set', () => {
    render(<Login />)
    expect(screen.queryByPlaceholderText(/bypass token/i)).not.toBeInTheDocument()
  })
})

// DevBypassSection is tested in isolation (exported) so we avoid jest.resetModules
// which causes React instance conflicts in jsdom.
describe('DevBypassSection', () => {
  beforeEach(() => {
    mockSignIn.mockClear()
  })

  test('renders token input and Go button', () => {
    render(<DevBypassSection />)
    expect(screen.getByPlaceholderText(/bypass token/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^go$/i })).toBeInTheDocument()
  })

  test('calls signIn with bypass provider and entered token', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    const { location } = window
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { href: '' },
    })

    render(<DevBypassSection />)
    fireEvent.change(screen.getByPlaceholderText(/bypass token/i), {
      target: { value: 'my-secret' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^go$/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('bypass', { secret: 'my-secret', redirect: false })
    })

    Object.defineProperty(window, 'location', { writable: true, value: location })
  })

  test('shows error alert on wrong token', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' })
    render(<DevBypassSection />)

    fireEvent.change(screen.getByPlaceholderText(/bypass token/i), {
      target: { value: 'wrong' },
    })
    fireEvent.click(screen.getByRole('button', { name: /^go$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  test('does not call signIn when token is empty', () => {
    render(<DevBypassSection />)
    fireEvent.click(screen.getByRole('button', { name: /^go$/i }))
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})

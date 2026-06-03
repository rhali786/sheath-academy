import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login, { DevBypassSection } from '@/features/auth/front/pages/Login'

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
  getProviders: jest.fn().mockResolvedValue({ resend: { id: 'resend', name: 'Resend' } }),
}))

import { signIn } from 'next-auth/react'
const mockSignIn = signIn as jest.Mock

beforeEach(() => {
  mockSignIn.mockClear()
})

function switchToMagicTab() {
  fireEvent.click(screen.getByRole('button', { name: /^magic link$/i }))
}

describe('Login page — layout', () => {
  test('renders brand logo and Sheath name', () => {
    render(<Login />)
    expect(screen.getByText('Sheath')).toBeInTheDocument()
    expect(screen.getByTestId('sheath-logo')).toBeInTheDocument()
  })

  test('defaults to password tab — shows identifier and password inputs', () => {
    render(<Login />)
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  test('magic link tab shows email input', () => {
    render(<Login />)
    switchToMagicTab()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /send magic link/i })).toBeInTheDocument()
  })

  test('does not show OAuth buttons when providers are not configured', () => {
    render(<Login />)
    expect(screen.queryByRole('button', { name: /continue with google/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /continue with facebook/i })).not.toBeInTheDocument()
  })
})

describe('Login page — credentials flow', () => {
  test('submitting valid credentials calls signIn with credentials provider', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    render(<Login />)

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'secret' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
        identifier: 'user@example.com',
        password: 'secret',
        redirect: false,
      }))
    })
  })

  test('shows error when identifier is empty', async () => {
    render(<Login />)
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/email or username/i)
    })
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  test('shows error when password is empty', async () => {
    render(<Login />)
    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'user@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/password/i)
    })
    expect(mockSignIn).not.toHaveBeenCalled()
  })

  test('shows error on bad credentials', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' })
    render(<Login />)

    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'user@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrong' } })
    fireEvent.click(screen.getByRole('button', { name: /^sign in$/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect/i)
    })
  })
})

describe('Login page — magic link flow', () => {
  test('submitting a valid email calls signIn with resend provider', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    render(<Login />)
    switchToMagicTab()

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'parent@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('resend', {
        email: 'parent@example.com',
        redirect: false,
        callbackUrl: '/',
      })
    })
  })

  test('shows success message after email is submitted', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    render(<Login />)
    switchToMagicTab()

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'parent@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByText(/check your email/i)).toBeInTheDocument()
    })
  })

  test('shows error message when signIn fails', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'EmailSignin' })
    render(<Login />)
    switchToMagicTab()

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'parent@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  test('shows error when signIn returns ok:true with Configuration error (Resend failure)', async () => {
    mockSignIn.mockResolvedValue({ ok: true, error: 'Configuration', status: 200 })
    render(<Login />)
    switchToMagicTab()

    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'parent@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/resend testing/i)
    })
    expect(screen.queryByText(/check your email/i)).not.toBeInTheDocument()
  })

  test('shows validation error when email is empty', async () => {
    render(<Login />)
    switchToMagicTab()
    fireEvent.click(screen.getByRole('button', { name: /send magic link/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})

describe('Login page — dev bypass section hidden by default', () => {
  test('bypass section is not rendered when NEXT_PUBLIC_DEV_MODE is not set', () => {
    render(<Login />)
    expect(screen.queryByPlaceholderText(/bypass token/i)).not.toBeInTheDocument()
  })
})

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
      expect(mockSignIn).toHaveBeenCalledWith('bypass', {
        secret: 'my-secret',
        redirect: false,
        callbackUrl: '/',
      })
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

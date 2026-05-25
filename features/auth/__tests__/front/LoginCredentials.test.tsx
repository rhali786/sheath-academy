import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Login from '@/features/auth/front/pages/Login'

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

describe('Login page — credentials form', () => {
  test('renders email or username and password fields', () => {
    render(<Login />)
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
  })

  test('renders sign in with password button', () => {
    render(<Login />)
    expect(screen.getByRole('button', { name: /sign in with password/i })).toBeInTheDocument()
  })

  test('renders forgot password link', () => {
    render(<Login />)
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument()
  })

  test('renders create account link', () => {
    render(<Login />)
    expect(screen.getByRole('link', { name: /create account/i })).toBeInTheDocument()
  })

  test('calls signIn with credentials provider on submit', async () => {
    mockSignIn.mockResolvedValue({ ok: true })
    const { location } = window
    Object.defineProperty(window, 'location', { writable: true, value: { href: '' } })

    render(<Login />)
    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'parent@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in with password/i }))

    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith('credentials', expect.objectContaining({
        identifier: 'parent@example.com',
        password: 'password123',
        redirect: false,
      }))
    })

    Object.defineProperty(window, 'location', { writable: true, value: location })
  })

  test('shows error alert for wrong credentials', async () => {
    mockSignIn.mockResolvedValue({ ok: false, error: 'CredentialsSignin' })
    render(<Login />)
    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'bad@example.com' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in with password/i }))

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/incorrect email, username, or password/i)
    })
  })

  test('does not call signIn when identifier is empty', () => {
    render(<Login />)
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.click(screen.getByRole('button', { name: /sign in with password/i }))
    expect(mockSignIn).not.toHaveBeenCalled()
  })
})

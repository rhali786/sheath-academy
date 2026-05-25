import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPassword from '@/features/auth/front/pages/ForgotPassword'

global.fetch = jest.fn()
const mockFetch = global.fetch as jest.Mock

beforeEach(() => {
  mockFetch.mockReset()
  mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: 'success' }) })
})

describe('ForgotPassword page — layout', () => {
  test('renders brand and heading', () => {
    render(<ForgotPassword />)
    expect(screen.getByText('Sheath Academy')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /reset password/i })).toBeInTheDocument()
  })

  test('renders email or username input', () => {
    render(<ForgotPassword />)
    expect(screen.getByLabelText(/email or username/i)).toBeInTheDocument()
  })

  test('renders back to sign in link', () => {
    render(<ForgotPassword />)
    expect(screen.getByRole('link', { name: /back to sign in/i })).toBeInTheDocument()
  })
})

describe('ForgotPassword page — submission', () => {
  test('shows generic confirmation after submit regardless of account existence', async () => {
    render(<ForgotPassword />)
    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'anyone@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    await waitFor(() => {
      expect(screen.getByText(/If this account can receive email/i)).toBeInTheDocument()
    })
  })

  test('does not submit when input is empty', async () => {
    render(<ForgotPassword />)
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('shows loading state on button while submitting', async () => {
    let resolve: (v: unknown) => void
    mockFetch.mockReturnValue(new Promise(r => { resolve = r }))
    render(<ForgotPassword />)
    fireEvent.change(screen.getByLabelText(/email or username/i), { target: { value: 'test@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))
    expect(screen.getByRole('button', { name: /sending/i })).toBeInTheDocument()
    resolve!({ ok: true, json: () => Promise.resolve({ status: 'success' }) })
  })
})

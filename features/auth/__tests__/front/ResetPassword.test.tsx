import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ResetPassword from '@/features/auth/front/pages/ResetPassword'

global.fetch = jest.fn()
const mockFetch = global.fetch as jest.Mock

jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('token=valid-token-abc'),
}))

beforeEach(() => {
  mockFetch.mockReset()
})

describe('ResetPassword page — layout', () => {
  test('renders brand and heading', () => {
    render(<ResetPassword />)
    expect(screen.getByText('Sheath Academy')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /set new password/i })).toBeInTheDocument()
  })

  test('renders new password and confirm password fields', () => {
    render(<ResetPassword />)
    expect(screen.getByLabelText(/new password/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })
})

describe('ResetPassword page — success', () => {
  test('shows success state after successful reset', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: 'success' }) })
    render(<ResetPassword />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(screen.getByText(/password updated/i)).toBeInTheDocument()
    })
  })
})

describe('ResetPassword page — invalid token', () => {
  test('shows expired/invalid state when server returns 400', async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400, json: () => Promise.resolve({ message: 'Token expired' }) })
    render(<ResetPassword />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'newpass123' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(screen.getByText(/expired or invalid/i)).toBeInTheDocument()
    })
  })
})

describe('ResetPassword page — validation', () => {
  test('shows error when passwords do not match', async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'newpass123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'different' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/do not match/i)
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })

  test('shows error when password is too short', async () => {
    render(<ResetPassword />)
    fireEvent.change(screen.getByLabelText(/new password/i), { target: { value: 'short' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'short' } })
    fireEvent.click(screen.getByRole('button', { name: /update password/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/8 characters/i)
    })
    expect(mockFetch).not.toHaveBeenCalled()
  })
})

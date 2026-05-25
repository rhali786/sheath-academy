import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Signup from '@/features/auth/front/pages/Signup'

global.fetch = jest.fn()
const mockFetch = global.fetch as jest.Mock

beforeEach(() => {
  mockFetch.mockReset()
})

describe('Signup page — layout', () => {
  test('renders brand and heading', () => {
    render(<Signup />)
    expect(screen.getByText('Sheath Academy')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /create account/i })).toBeInTheDocument()
  })

  test('renders all required fields', () => {
    render(<Signup />)
    expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^username$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument()
  })

  test('renders sign-in link', () => {
    render(<Signup />)
    expect(screen.getByRole('link', { name: /sign in/i })).toBeInTheDocument()
  })
})

describe('Signup page — submission', () => {
  function fillForm() {
    fireEvent.change(screen.getByLabelText(/^name$/i), { target: { value: 'Ahmed Ali' } })
    fireEvent.change(screen.getByLabelText(/^email$/i), { target: { value: 'ahmed@example.com' } })
    fireEvent.change(screen.getByLabelText(/^username$/i), { target: { value: 'ahmed_ali' } })
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } })
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } })
  }

  test('shows success state after successful submission', async () => {
    mockFetch.mockResolvedValue({ ok: true, json: () => Promise.resolve({ status: 'success' }) })
    render(<Signup />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/account created/i)).toBeInTheDocument()
    })
  })

  test('shows field errors from server response', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 422,
      json: () => Promise.resolve({ status: 'error', message: 'Validation failed', errors: { email: 'An account with this email already exists.' } }),
    })
    render(<Signup />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByText(/already exists/i)).toBeInTheDocument()
    })
  })

  test('shows form-level error when server returns generic message', async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ status: 'error', message: 'Server error' }),
    })
    render(<Signup />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })

  test('button shows loading state while submitting', async () => {
    let resolve: (v: unknown) => void
    mockFetch.mockReturnValue(new Promise(r => { resolve = r }))
    render(<Signup />)
    fillForm()
    fireEvent.click(screen.getByRole('button', { name: /create account/i }))
    expect(screen.getByRole('button', { name: /creating/i })).toBeInTheDocument()
    resolve!({ ok: true, json: () => Promise.resolve({ status: 'success' }) })
  })
})

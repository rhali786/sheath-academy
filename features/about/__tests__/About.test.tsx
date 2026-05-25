import React from 'react'
import { render, screen } from '@testing-library/react'
import { AboutPage } from '@/features/about/front/pages/About'

// About page is pure content — no hooks, no providers needed.
// Header and HouseholdProvider are supplied by AppShell in the (shell) layout;
// About.tsx itself has no dependency on them.

describe('About page', () => {
  test('renders without crashing', () => {
    render(<AboutPage />)
    expect(screen.getByText(/Built for this family/i)).toBeInTheDocument()
  })

  test('renders the North Star quote', () => {
    render(<AboutPage />)
    expect(screen.getByText(/Reduce the invisible operational burden/i)).toBeInTheDocument()
  })

  test('renders the four Wave 1 sections', () => {
    render(<AboutPage />)
    expect(screen.getByText('1A — Foundation')).toBeInTheDocument()
    expect(screen.getByText('1B — Planning spine')).toBeInTheDocument()
    expect(screen.getByText('1C — Records spine')).toBeInTheDocument()
    expect(screen.getByText('1D — Proof and records')).toBeInTheDocument()
  })

  test('renders the sign-in link in the footer', () => {
    render(<AboutPage />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  test('renders product feedback CTA linking to /product-validation', () => {
    render(<AboutPage />)
    const cta = screen.getByTestId('about-feedback-cta')
    expect(cta).toHaveAttribute('href', '/product-validation')
  })
})

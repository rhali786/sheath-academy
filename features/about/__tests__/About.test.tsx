import React from 'react'
import { render, screen } from '@testing-library/react'
import { AboutPage } from '@/features/about/front/pages/About'
import type { ChangelogEntry } from '@/features/about/types'

// About page is pure content — no hooks, no providers needed.
// Header and HouseholdProvider are supplied by AppShell in the (shell) layout;
// About.tsx itself has no dependency on them.

const stewardEntry: ChangelogEntry = {
  id: 'cl_1',
  version: '2.8.3',
  label: 'Dashboard filter fix from community feedback',
  detail: 'Fixed dashboard learner filtering from linked alert cards.',
  source: 'steward',
  prNumber: 42,
  userCredit: 'parent@example.com',
  status: 'pending',
  createdAt: '2026-05-25T18:00:00.000Z',
}

const stewardEntryNoCredit: ChangelogEntry = {
  id: 'cl_2',
  version: '2.8.4',
  label: 'Dashboard button label clarified',
  detail: 'Button now reads Start Session instead of Begin.',
  source: 'steward',
  prNumber: 43,
  userCredit: null,
  status: 'shipped',
  createdAt: '2026-05-26T10:00:00.000Z',
}

describe('About page', () => {
  test('renders without crashing', () => {
    render(<AboutPage changelogEntries={[]} />)
    expect(screen.getByText(/Built for this family/i)).toBeInTheDocument()
  })

  test('renders the North Star quote', () => {
    render(<AboutPage changelogEntries={[]} />)
    expect(screen.getByText(/Reduce the invisible operational burden/i)).toBeInTheDocument()
  })

  test('renders the four Wave 1 sections', () => {
    render(<AboutPage changelogEntries={[]} />)
    expect(screen.getByText('1A — Foundation')).toBeInTheDocument()
    expect(screen.getByText('1B — Planning spine')).toBeInTheDocument()
    expect(screen.getByText('1C — Records spine')).toBeInTheDocument()
    expect(screen.getByText('1D — Proof and records')).toBeInTheDocument()
  })

  test('renders the sign-in link in the footer', () => {
    render(<AboutPage changelogEntries={[]} />)
    const link = screen.getByRole('link', { name: /sign in/i })
    expect(link).toHaveAttribute('href', '/login')
  })

  test('renders product feedback CTA linking to /product-validation', () => {
    render(<AboutPage changelogEntries={[]} />)
    const cta = screen.getByTestId('about-feedback-cta')
    expect(cta).toHaveAttribute('href', '/product-validation')
  })

  test('renders steward-generated changelog entry version and label', () => {
    render(<AboutPage changelogEntries={[stewardEntry]} />)
    expect(screen.getByText('2.8.3')).toBeInTheDocument()
    expect(screen.getByText('Dashboard filter fix from community feedback')).toBeInTheDocument()
  })

  test('renders pending tag for pending steward entries', () => {
    render(<AboutPage changelogEntries={[stewardEntry]} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
  })

  test('renders shipped tag for shipped steward entries', () => {
    render(<AboutPage changelogEntries={[stewardEntryNoCredit]} />)
    expect(screen.getByText('Shipped')).toBeInTheDocument()
  })

  test('renders steward entry user credit when present', () => {
    render(<AboutPage changelogEntries={[stewardEntry]} />)
    expect(screen.getByText(/parent@example\.com/)).toBeInTheDocument()
  })

  test('does not render user credit section when credit is null', () => {
    render(<AboutPage changelogEntries={[stewardEntryNoCredit]} />)
    expect(screen.queryByText(/Suggested by/)).not.toBeInTheDocument()
  })

  test('renders multiple steward entries', () => {
    render(<AboutPage changelogEntries={[stewardEntry, stewardEntryNoCredit]} />)
    expect(screen.getByText('2.8.3')).toBeInTheDocument()
    expect(screen.getByText('2.8.4')).toBeInTheDocument()
  })

  test('renders both pending and shipped tags when entries are mixed', () => {
    render(<AboutPage changelogEntries={[stewardEntry, stewardEntryNoCredit]} />)
    expect(screen.getByText('Pending')).toBeInTheDocument()
    expect(screen.getByText('Shipped')).toBeInTheDocument()
  })

  test('still renders static changelog entries when steward entries are also present', () => {
    render(<AboutPage changelogEntries={[stewardEntry]} />)
    // Static entries are always rendered alongside steward entries
    expect(screen.getByText('0.35.0')).toBeInTheDocument()
  })

  test('renders gracefully with no steward entries — static changelog still shows', () => {
    render(<AboutPage changelogEntries={[]} />)
    expect(screen.getByText('0.35.0')).toBeInTheDocument()
  })
})

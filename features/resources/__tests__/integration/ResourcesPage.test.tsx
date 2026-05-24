/**
 * Integration tests for Wave 13 — Resources / curriculum pacing engine
 * TDD: written before full implementation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ResourceForm } from '@/features/resources/front/components/ResourceForm'
import { PacingCard } from '@/features/resources/front/components/PacingCard'
import { VerificationBadge } from '@/features/resources/front/components/VerificationBadge'

// ── ResourceForm ──────────────────────────────────────────────────────────────

describe('ResourceForm', () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined)
  const onCancel = jest.fn()

  beforeEach(() => jest.clearAllMocks())

  it('renders title, publisher, edition, and resource type fields', () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    expect(screen.getByTestId('resource-title-input')).toBeInTheDocument()
    expect(screen.getByTestId('resource-publisher-input')).toBeInTheDocument()
    expect(screen.getByTestId('resource-edition-input')).toBeInTheDocument()
    expect(screen.getByTestId('resource-type-select')).toBeInTheDocument()
  })

  it('shows lesson generation hint after total pages are entered', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    expect(screen.queryByTestId('lesson-generation-hint')).not.toBeInTheDocument()

    await userEvent.type(screen.getByTestId('resource-total-pages-input'), '360')

    expect(screen.getByTestId('lesson-generation-hint')).toBeInTheDocument()
  })

  it('shows lesson generation hint after total chapters are entered', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByTestId('resource-total-chapters-input'), '30')
    expect(screen.getByTestId('lesson-generation-hint')).toBeInTheDocument()
  })

  it('calls onSubmit with form data when submitted', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} />)
    await userEvent.type(screen.getByTestId('resource-title-input'), 'Saxon Math 7/6')
    await userEvent.type(screen.getByTestId('resource-publisher-input'), 'Saxon')
    fireEvent.submit(screen.getByTestId('resource-form'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Saxon Math 7/6', publisher: 'Saxon' })
    ))
  })

  it('calls onCancel when Cancel is clicked', async () => {
    render(<ResourceForm workspaceId="ws_001" onSubmit={onSubmit} onCancel={onCancel} />)
    await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
    expect(onCancel).toHaveBeenCalled()
  })
})

// ── PacingCard ────────────────────────────────────────────────────────────────

describe('PacingCard', () => {
  it('shows behind-pace message when isOnTrack is false', () => {
    render(
      <PacingCard
        paceResult={{ pagesPerDay: 2.4, pagesPerDayNeeded: 2.525, isOnTrack: false }}
        totalPages={360}
        completedPages={57}
      />
    )
    expect(screen.getByTestId('behind-pace-message')).toBeInTheDocument()
    expect(screen.getByText(/you need 2.5 pages\/day to finish on time/i)).toBeInTheDocument()
  })

  it('shows on-pace message when isOnTrack is true', () => {
    render(
      <PacingCard
        paceResult={{ pagesPerDay: 2.4, pagesPerDayNeeded: 2.4, isOnTrack: true }}
        totalPages={360}
        completedPages={72}
      />
    )
    expect(screen.getByTestId('on-pace-message')).toBeInTheDocument()
  })
})

// ── VerificationBadge ─────────────────────────────────────────────────────────

describe('VerificationBadge', () => {
  it('renders "Verified" badge with correct testid', () => {
    render(<VerificationBadge status="verified" />)
    expect(screen.getByTestId('verification-badge-verified')).toBeInTheDocument()
    expect(screen.getByText('Verified')).toBeInTheDocument()
  })

  it('renders "Needs review" badge with correct testid', () => {
    render(<VerificationBadge status="needs-review" />)
    expect(screen.getByTestId('verification-badge-needs-review')).toBeInTheDocument()
    expect(screen.getByText('Needs review')).toBeInTheDocument()
  })
})

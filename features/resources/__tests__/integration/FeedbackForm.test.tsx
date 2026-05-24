/**
 * Integration tests for Wave 14 — Community curriculum intelligence
 * TDD: written before implementation
 */

import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FeedbackForm } from '@/features/resources/front/components/FeedbackForm'
import { CommunityNoteCard } from '@/features/resources/front/components/CommunityNoteCard'
import type { CommunityNote } from '@/features/resources/types'

describe('FeedbackForm', () => {
  const onSubmit = jest.fn().mockResolvedValue(undefined)

  beforeEach(() => jest.clearAllMocks())

  it('renders the Islamic compatibility selector', () => {
    render(
      <FeedbackForm resourceId="res_001" parentId="parent_001" onSubmit={onSubmit} />
    )
    expect(screen.getByTestId('islamic-compatibility-selector')).toBeInTheDocument()
    expect(screen.getByText(/generally compatible/i)).toBeInTheDocument()
    expect(screen.getByText(/needs parent context/i)).toBeInTheDocument()
  })

  it('renders the privacy selector with Anonymous option', () => {
    render(
      <FeedbackForm resourceId="res_001" parentId="parent_001" onSubmit={onSubmit} />
    )
    const privacySelect = screen.getByTestId('feedback-privacy-select')
    expect(privacySelect).toBeInTheDocument()
    expect(privacySelect).toHaveValue('anonymous')
  })

  it('shows "under review" confirmation after successful submit', async () => {
    render(
      <FeedbackForm resourceId="res_001" parentId="parent_001" onSubmit={onSubmit} />
    )
    fireEvent.submit(screen.getByTestId('feedback-form'))
    await waitFor(() => {
      expect(screen.getByTestId('feedback-under-review')).toBeInTheDocument()
    })
    expect(screen.getByText(/under review/i)).toBeInTheDocument()
  })

  it('calls onSubmit with anonymous as default privacy', async () => {
    render(
      <FeedbackForm resourceId="res_001" parentId="parent_001" onSubmit={onSubmit} />
    )
    fireEvent.submit(screen.getByTestId('feedback-form'))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ privacyLevel: 'anonymous' })
    )
  })
})

describe('CommunityNoteCard', () => {
  const verifiedNote: CommunityNote = {
    id: 'note_001',
    resourceId: 'res_001',
    feedbackId: 'fb_001',
    difficulty: 'Moderate',
    islamicNote: 'Good for Muslim families',
    status: 'verified',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  }

  it('renders nothing when no note is provided', () => {
    const { container } = render(<CommunityNoteCard note={null} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders nothing when note status is pending_review', () => {
    const { container } = render(
      <CommunityNoteCard note={{ ...verifiedNote, status: 'pending_review' }} />
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders the community note section when note is verified', () => {
    render(<CommunityNoteCard note={verifiedNote} />)
    expect(screen.getByTestId('community-note-card')).toBeInTheDocument()
    expect(screen.getByText(/community note/i)).toBeInTheDocument()
  })

  it('shows difficulty and islamic note fields', () => {
    render(<CommunityNoteCard note={verifiedNote} />)
    expect(screen.getByText(/moderate/i)).toBeInTheDocument()
    expect(screen.getByText(/good for muslim families/i)).toBeInTheDocument()
  })
})

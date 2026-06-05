import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RejectModal } from '@/features/feedback/front/components/RejectModal'

describe('RejectModal', () => {
  const onConfirm = jest.fn()
  const onCancel = jest.fn()

  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('renders the modal with reject title and message preview', () => {
    render(
      <RejectModal
        feedbackId="fb_1"
        feedbackMessage="Dashboard looks broken"
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    )

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Reject planning')).toBeInTheDocument()
    expect(screen.getByText('Dashboard looks broken')).toBeInTheDocument()
  })

  it('calls onCancel when Cancel button is clicked', () => {
    render(
      <RejectModal feedbackId="fb_1" feedbackMessage={undefined} onConfirm={onConfirm} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('calls onCancel when backdrop is clicked', () => {
    const { container } = render(
      <RejectModal feedbackId="fb_1" feedbackMessage={undefined} onConfirm={onConfirm} onCancel={onCancel} />
    )

    const backdrop = container.querySelector('.fixed.inset-0')!
    fireEvent.click(backdrop)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onConfirm with the feedbackId when Reject is clicked', async () => {
    onConfirm.mockResolvedValue(undefined)

    render(
      <RejectModal feedbackId="fb_1" feedbackMessage={undefined} onConfirm={onConfirm} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByRole('button', { name: /^Reject$/i }))

    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalledWith('fb_1')
    })
  })

  it('does not call the endpoint when Cancel is used without confirming', () => {
    render(
      <RejectModal feedbackId="fb_1" feedbackMessage="Some message" onConfirm={onConfirm} onCancel={onCancel} />
    )

    fireEvent.click(screen.getByRole('button', { name: /cancel/i }))

    expect(onConfirm).not.toHaveBeenCalled()
  })
})

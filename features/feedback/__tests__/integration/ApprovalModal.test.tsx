import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ApprovalModal } from '@/features/feedback/front/components/ApprovalModal'

const mockProps = {
  feedbackId: 'fb_1',
  feedbackMessage: 'Dashboard works great',
  onConfirm: jest.fn().mockResolvedValue(undefined),
  onCancel: jest.fn(),
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe('ApprovalModal', () => {
  it('renders modal with feedback message', () => {
    render(<ApprovalModal {...mockProps} />)
    expect(screen.getByText('Approve feedback')).toBeInTheDocument()
    expect(screen.getByText('Are you sure you want to approve this feedback for processing?')).toBeInTheDocument()
    expect(screen.getByText('Dashboard works great')).toBeInTheDocument()
  })

  it('renders modal without message when not provided', () => {
    render(<ApprovalModal {...mockProps} feedbackMessage={undefined} />)
    expect(screen.getByText('Approve feedback')).toBeInTheDocument()
    expect(screen.queryByText('Dashboard works great')).not.toBeInTheDocument()
  })

  it('calls onCancel when cancel button clicked', () => {
    render(<ApprovalModal {...mockProps} />)
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    fireEvent.click(cancelButton)
    expect(mockProps.onCancel).toHaveBeenCalled()
  })

  it('calls onCancel when backdrop clicked', () => {
    render(<ApprovalModal {...mockProps} />)
    const backdrop = screen.getByRole('dialog').parentElement
    fireEvent.click(backdrop!)
    expect(mockProps.onCancel).toHaveBeenCalled()
  })

  it('does not close when modal content is clicked', () => {
    render(<ApprovalModal {...mockProps} />)
    const modalContent = screen.getByRole('dialog')
    fireEvent.click(modalContent)
    expect(mockProps.onCancel).not.toHaveBeenCalled()
  })

  it('calls onConfirm when approve button clicked', async () => {
    render(<ApprovalModal {...mockProps} />)
    const approveButton = screen.getByRole('button', { name: /^Approve$/i })
    fireEvent.click(approveButton)
    await waitFor(() => {
      expect(mockProps.onConfirm).toHaveBeenCalledWith('fb_1')
    })
  })

  it('disables buttons while submitting', async () => {
    const slowConfirm = jest.fn(() => new Promise(resolve => setTimeout(resolve, 50)))
    render(<ApprovalModal {...mockProps} onConfirm={slowConfirm} />)
    const approveButton = screen.getByRole('button', { name: /^Approve$/i })
    fireEvent.click(approveButton)
    expect(approveButton).toBeDisabled()
  })

  it('shows error message when onConfirm throws', async () => {
    const errorConfirm = jest.fn(() => Promise.reject(new Error('Approval failed')))
    render(<ApprovalModal {...mockProps} onConfirm={errorConfirm} />)
    const approveButton = screen.getByRole('button', { name: /^Approve$/i })
    fireEvent.click(approveButton)
    await waitFor(() => {
      expect(screen.getByText('Approval failed')).toBeInTheDocument()
    })
  })

  it('shows "Approving..." text while submitting', async () => {
    let resolvePromise: () => void
    const slowConfirm = jest.fn(() => new Promise(resolve => {
      resolvePromise = resolve as () => void
    }))
    render(<ApprovalModal {...mockProps} onConfirm={slowConfirm} />)
    const approveButton = screen.getByRole('button', { name: /^Approve$/i })
    fireEvent.click(approveButton)
    expect(screen.getByText('Approving…')).toBeInTheDocument()
    resolvePromise!()
  })

  it('shows "Approve" text when not submitting', () => {
    render(<ApprovalModal {...mockProps} />)
    expect(screen.getByRole('button', { name: /^Approve$/i })).toBeInTheDocument()
  })

  it('has proper ARIA attributes for accessibility', () => {
    render(<ApprovalModal {...mockProps} />)
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveAttribute('aria-modal', 'true')
    expect(dialog).toHaveAttribute('aria-labelledby', 'approval-title')
  })
})

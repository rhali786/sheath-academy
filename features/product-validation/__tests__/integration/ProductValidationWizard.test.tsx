import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductValidationWizard } from '@/features/product-validation/front/components/ProductValidationWizard'

jest.mock('@/features/product-validation/front/services/api', () => ({
  productValidationApi: {
    createResponse: jest.fn().mockResolvedValue({ id: 'pvr_test' }),
  },
}))

describe('ProductValidationWizard', () => {
  it('renders step 1 with progress label', () => {
    render(<ProductValidationWizard defaultEmail="parent@test.com" />)
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
    expect(screen.getByTestId('product-validation-wizard')).toBeInTheDocument()
  })

  it('shows validation errors when continuing without required fields', () => {
    render(<ProductValidationWizard />)
    fireEvent.click(screen.getByTestId('wizard-continue'))
    expect(screen.getByTestId('wizard-validation-errors')).toBeInTheDocument()
  })

  it('advances to step 2 when step 1 is valid', () => {
    render(<ProductValidationWizard defaultEmail="parent@test.com" />)
    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }))
    fireEvent.click(screen.getByTestId('wizard-continue'))
    expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Previous pain' })).toBeInTheDocument()
  })

  it('preserves answers when navigating back', () => {
    render(<ProductValidationWizard defaultEmail="parent@test.com" />)
    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }))
    fireEvent.click(screen.getByTestId('wizard-continue'))
    fireEvent.click(screen.getByTestId('previousPain-score-4'))
    fireEvent.change(screen.getByLabelText(/what did sheath academy replace/i), {
      target: { value: 'Paper planner' },
    })
    fireEvent.click(screen.getByTestId('wizard-continue'))
    fireEvent.click(screen.getByRole('button', { name: 'Back' }))
    expect(screen.getByDisplayValue('Paper planner')).toBeInTheDocument()
  })

  it('submits and shows thank-you state', async () => {
    const { productValidationApi } = jest.requireMock(
      '@/features/product-validation/front/services/api',
    )
    render(<ProductValidationWizard defaultEmail="parent@test.com" />)

    fireEvent.click(screen.getByRole('button', { name: /dashboard/i }))
    fireEvent.click(screen.getByTestId('wizard-continue'))

    fireEvent.click(screen.getByTestId('previousPain-score-4'))
    fireEvent.change(screen.getByLabelText(/what did sheath academy replace/i), {
      target: { value: 'Spreadsheets' },
    })
    fireEvent.click(screen.getByTestId('wizard-continue'))

    fireEvent.click(screen.getByTestId('improvement-score-4'))
    fireEvent.click(screen.getByTestId('ease-score-3'))
    fireEvent.change(screen.getByLabelText(/most useful part/i), {
      target: { value: 'Planner' },
    })
    fireEvent.change(screen.getByLabelText(/confusing or burdensome/i), {
      target: { value: 'None' },
    })
    fireEvent.click(screen.getByTestId('wizard-continue'))

    fireEvent.click(screen.getByTestId('trust-score-4'))
    fireEvent.change(screen.getByLabelText(/must-have/i), {
      target: { value: 'Reports' },
    })
    fireEvent.click(screen.getByTestId('wizard-continue'))

    fireEvent.click(screen.getByTestId('retention-score-5'))
    fireEvent.click(screen.getByTestId('pay-score-5'))
    fireEvent.click(screen.getByTestId('referral-score-5'))
    fireEvent.change(screen.getByLabelText(/lost access tomorrow/i), {
      target: { value: 'Revert' },
    })
    fireEvent.change(screen.getByLabelText(/recommend this to/i), {
      target: { value: 'Friends' },
    })
    fireEvent.change(screen.getByLabelText(/message would you send/i), {
      target: { value: 'Try it' },
    })
    fireEvent.click(screen.getByTestId('wizard-continue'))

    fireEvent.click(screen.getByTestId('positioning-score-4'))
    fireEvent.click(screen.getByTestId('wizard-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('feedback-thank-you')).toBeInTheDocument()
    })
    expect(productValidationApi.createResponse).toHaveBeenCalled()
  })
})

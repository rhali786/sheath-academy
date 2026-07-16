/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { RecordsComplianceTab } from '@/features/settings/front/components/RecordsComplianceTab'

jest.mock('@/features/settings/front/services/api', () => ({
  settingsApi: {
    getSettings: jest.fn(),
    updateSettings: jest.fn(),
  },
}))

const { settingsApi } = jest.requireMock('@/features/settings/front/services/api') as {
  settingsApi: { getSettings: jest.Mock; updateSettings: jest.Mock }
}

beforeEach(() => {
  jest.clearAllMocks()
  settingsApi.getSettings.mockResolvedValue({
    status: 'success',
    data: { 'records.trackingMethod': 'days', 'records.exportFormat': 'pdf' },
    message: 'ok',
    timestamp: '',
  })
  settingsApi.updateSettings.mockResolvedValue({
    status: 'success',
    data: { 'records.trackingMethod': 'hours', 'records.exportFormat': 'pdf' },
    message: 'ok',
    timestamp: '',
  })
})

describe('RecordsComplianceTab', () => {
  it('renders stored settings on load', async () => {
    render(<RecordsComplianceTab />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Attendance tracking method/i)).toHaveValue('days')
    })
    expect(screen.getByLabelText(/Default export format/i)).toHaveValue('pdf')
  })

  it('disables Save until an edit is made', async () => {
    render(<RecordsComplianceTab />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Attendance tracking method/i)).not.toBeDisabled()
    })
    expect(screen.getByTestId('records-compliance-save')).toBeDisabled()

    await userEvent.selectOptions(screen.getByLabelText(/Attendance tracking method/i), 'hours')

    expect(screen.getByTestId('records-compliance-save')).toBeEnabled()
  })

  it('saves the edited value and shows a confirmation', async () => {
    render(<RecordsComplianceTab />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Attendance tracking method/i)).not.toBeDisabled()
    })

    await userEvent.selectOptions(screen.getByLabelText(/Attendance tracking method/i), 'hours')
    await userEvent.click(screen.getByTestId('records-compliance-save'))

    await waitFor(() => {
      expect(screen.getByTestId('records-compliance-success')).toBeInTheDocument()
    })
    expect(settingsApi.updateSettings).toHaveBeenCalledWith({
      'records.trackingMethod': 'hours',
      'records.exportFormat': 'pdf',
    })
    expect(screen.getByTestId('records-compliance-save')).toBeDisabled()
  })
})

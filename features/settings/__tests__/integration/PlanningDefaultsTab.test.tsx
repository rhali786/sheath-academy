/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { PlanningDefaultsTab } from '@/features/settings/front/components/PlanningDefaultsTab'

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
    data: { 'planning.maxLessonsPerDay': 3 },
    message: 'ok',
    timestamp: '',
  })
  settingsApi.updateSettings.mockResolvedValue({
    status: 'success',
    data: { 'planning.maxLessonsPerDay': 5 },
    message: 'ok',
    timestamp: '',
  })
})

describe('PlanningDefaultsTab', () => {
  it('renders stored settings on load', async () => {
    render(<PlanningDefaultsTab />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Maximum lessons per day/i)).toHaveValue(3)
    })
  })

  it('disables Save until an edit is made', async () => {
    render(<PlanningDefaultsTab />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Maximum lessons per day/i)).toHaveValue(3)
    })
    expect(screen.getByTestId('planning-defaults-save')).toBeDisabled()

    await userEvent.clear(screen.getByLabelText(/Maximum lessons per day/i))
    await userEvent.type(screen.getByLabelText(/Maximum lessons per day/i), '5')

    expect(screen.getByTestId('planning-defaults-save')).toBeEnabled()
  })

  it('saves the edited value and shows a confirmation', async () => {
    render(<PlanningDefaultsTab />)
    await waitFor(() => {
      expect(screen.getByLabelText(/Maximum lessons per day/i)).toHaveValue(3)
    })

    await userEvent.clear(screen.getByLabelText(/Maximum lessons per day/i))
    await userEvent.type(screen.getByLabelText(/Maximum lessons per day/i), '5')
    await userEvent.click(screen.getByTestId('planning-defaults-save'))

    await waitFor(() => {
      expect(screen.getByTestId('planning-defaults-success')).toBeInTheDocument()
    })
    expect(settingsApi.updateSettings).toHaveBeenCalledWith({
      'planning.maxLessonsPerDay': 5,
      'planning.carryForward': 'next-day',
    })
    expect(screen.getByTestId('planning-defaults-save')).toBeDisabled()
  })
})

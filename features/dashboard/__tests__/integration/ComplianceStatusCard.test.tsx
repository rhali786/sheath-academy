import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { ComplianceStatusCard } from '@/features/dashboard/front/components/ComplianceStatusCard'

jest.mock('@/features/compliance/front/services/api', () => ({
  complianceApi: {
    getActiveSchoolYearId: jest.fn(),
    getStatus: jest.fn(),
    getDeadlines: jest.fn(),
  },
}))

import { complianceApi } from '@/features/compliance/front/services/api'
import { mockStatusResult, mockDeadlines } from '@/features/compliance/__tests__/fixtures/mockCompliance'

const mockGetActiveSchoolYearId = complianceApi.getActiveSchoolYearId as jest.Mock
const mockGetStatus = complianceApi.getStatus as jest.Mock
const mockGetDeadlines = complianceApi.getDeadlines as jest.Mock

function neverResolves() {
  return new Promise(() => {})
}

beforeEach(() => {
  mockGetActiveSchoolYearId.mockReset()
  mockGetStatus.mockReset()
  mockGetDeadlines.mockReset()
})

describe('ComplianceStatusCard', () => {
  it('shows a loading skeleton while fetching', async () => {
    mockGetActiveSchoolYearId.mockReturnValue(neverResolves())

    render(<ComplianceStatusCard />)

    expect(screen.getByTestId('compliance-status-card-loading')).toBeInTheDocument()
  })

  it('shows an empty state when there is no active school year', async () => {
    mockGetActiveSchoolYearId.mockResolvedValue(null)

    render(<ComplianceStatusCard />)

    await waitFor(() => {
      expect(screen.getByText('Set up compliance')).toBeInTheDocument()
    })
    expect(mockGetStatus).not.toHaveBeenCalled()
    expect(mockGetDeadlines).not.toHaveBeenCalled()
  })

  it('shows a retry affordance on fetch error', async () => {
    mockGetActiveSchoolYearId.mockRejectedValue(new Error('network error'))

    render(<ComplianceStatusCard />)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
  })

  it('retry re-fetches after a fetch error', async () => {
    mockGetActiveSchoolYearId.mockRejectedValueOnce(new Error('network error'))
    mockGetActiveSchoolYearId.mockResolvedValue('sy_001')
    mockGetStatus.mockResolvedValue({ status: 'success', data: mockStatusResult, message: '', timestamp: '' })
    mockGetDeadlines.mockResolvedValue({ status: 'success', data: mockDeadlines, message: '', timestamp: '' })

    render(<ComplianceStatusCard />)

    const retryButton = await screen.findByRole('button', { name: /retry/i })
    fireEvent.click(retryButton)

    await waitFor(() => {
      expect(screen.getByText('Needs attention')).toBeInTheDocument()
    })
  })

  it('renders status, reasons, and the next deadline when populated', async () => {
    mockGetActiveSchoolYearId.mockResolvedValue('sy_001')
    mockGetStatus.mockResolvedValue({ status: 'success', data: mockStatusResult, message: '', timestamp: '' })
    mockGetDeadlines.mockResolvedValue({ status: 'success', data: mockDeadlines, message: '', timestamp: '' })

    render(<ComplianceStatusCard />)

    await waitFor(() => {
      expect(screen.getByTestId('compliance-status-card')).toBeInTheDocument()
    })

    // yellow status -> "Needs attention" label
    expect(screen.getByText('Needs attention')).toBeInTheDocument()
    expect(screen.getByText(mockStatusResult.reasons[0])).toBeInTheDocument()
    // earliest not-completed deadline is 'Annual Assessment Submission' (2026-06-30);
    // the other fixture deadline is already completed and must be excluded
    expect(screen.getByText(/Annual Assessment Submission/)).toBeInTheDocument()
    expect(screen.queryByText(/Declaration of Intent/)).not.toBeInTheDocument()
  })

  it('renders green status label for a green result', async () => {
    mockGetActiveSchoolYearId.mockResolvedValue('sy_001')
    mockGetStatus.mockResolvedValue({
      status: 'success',
      data: { ...mockStatusResult, status: 'green', reasons: ['All requirements met'] },
      message: '',
      timestamp: '',
    })
    mockGetDeadlines.mockResolvedValue({ status: 'success', data: [], message: '', timestamp: '' })

    render(<ComplianceStatusCard />)

    await waitFor(() => {
      expect(screen.getByText('On track')).toBeInTheDocument()
    })
    expect(screen.getByText(/No upcoming deadlines/i)).toBeInTheDocument()
  })

  it('renders red status label for a red result', async () => {
    mockGetActiveSchoolYearId.mockResolvedValue('sy_001')
    mockGetStatus.mockResolvedValue({
      status: 'success',
      data: { ...mockStatusResult, status: 'red', reasons: ['Far behind requirement'] },
      message: '',
      timestamp: '',
    })
    mockGetDeadlines.mockResolvedValue({ status: 'success', data: [], message: '', timestamp: '' })

    render(<ComplianceStatusCard />)

    await waitFor(() => {
      expect(screen.getByText('Action required')).toBeInTheDocument()
    })
  })
})

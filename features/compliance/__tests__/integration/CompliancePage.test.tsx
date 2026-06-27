import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { CompliancePage } from '@/features/compliance/front/pages/CompliancePage'

jest.mock('@/features/compliance/front/services/api', () => ({
  complianceApi: {
    getStatus: jest.fn(),
    getRuleset: jest.fn(),
    getDeadlines: jest.fn(),
    getSubmissions: jest.fn(),
  },
}))

jest.mock('@/features/household/front/context', () => ({
  useHousehold: jest.fn(),
}))

import { complianceApi } from '@/features/compliance/front/services/api'
import { useHousehold } from '@/features/household/front/context'
import {
  mockStatusResult,
  mockRuleset,
  mockDeadlines,
  mockSubmissions,
} from '@/features/compliance/__tests__/fixtures/mockCompliance'

const mockGetStatus = complianceApi.getStatus as jest.Mock
const mockGetRuleset = complianceApi.getRuleset as jest.Mock
const mockGetDeadlines = complianceApi.getDeadlines as jest.Mock
const mockGetSubmissions = complianceApi.getSubmissions as jest.Mock
const mockUseHousehold = useHousehold as jest.Mock

const mockHouseholdValue = {
  householdProfile: { id: 'hh_fix_001', familyName: 'Test Family', workspaceId: 'ws1', createdAt: '' },
  studentProfiles: [],
  allSubjects: [],
  familyName: 'Test Family',
  needsSetup: false,
  loading: false,
  error: null,
  refetch: jest.fn(),
}

function ok<T>(data: T) {
  return Promise.resolve({ status: 'success', data, message: 'ok', timestamp: '' })
}

describe('CompliancePage', () => {
  beforeEach(() => {
    mockUseHousehold.mockImplementation(() => mockHouseholdValue)
    mockGetStatus.mockImplementation(() => ok(mockStatusResult))
    mockGetRuleset.mockImplementation(() => ok(mockRuleset))
    mockGetDeadlines.mockImplementation(() => ok(mockDeadlines))
    mockGetSubmissions.mockImplementation(() => ok(mockSubmissions))
  })

  afterEach(() => {
    mockUseHousehold.mockReset()
    mockGetStatus.mockReset()
    mockGetRuleset.mockReset()
    mockGetDeadlines.mockReset()
    mockGetSubmissions.mockReset()
  })

  it('shows loading state initially', () => {
    mockGetStatus.mockImplementation(() => new Promise(() => {}))
    render(<CompliancePage />)
    expect(screen.getByTestId('compliance-loading')).toBeInTheDocument()
  })

  it('shows error state when API fails', async () => {
    mockGetStatus.mockImplementation(() => Promise.reject(new Error('fail')))
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByTestId('compliance-error')).toBeInTheDocument()
    })
  })

  it('shows the illustrative banner (US2 — Layer 1 data not from real records)', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByTestId('compliance-illustrative-banner')).toBeInTheDocument()
      expect(screen.getByText(/Sample data/i)).toBeInTheDocument()
    })
  })

  it('shows the status hero with status color', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByTestId('compliance-status-hero')).toBeInTheDocument()
    })
  })

  it('shows next actions from the status engine', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByText(/38 more school days/i)).toBeInTheDocument()
    })
  })

  it('shows deadline timeline', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByTestId('compliance-deadlines')).toBeInTheDocument()
      expect(screen.getByText('Annual Assessment Submission')).toBeInTheDocument()
    })
  })

  it('shows "informational, not legal advice" disclaimer', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByTestId('compliance-legal-disclaimer')).toBeInTheDocument()
    })
  })

  it('shows ruleset provenance when available', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      const provenance = screen.getByTestId('compliance-provenance')
      expect(provenance).toBeInTheDocument()
      expect(provenance.textContent).toContain('TX')
    })
  })

  it('shows the submission tracker', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByTestId('compliance-submissions')).toBeInTheDocument()
    })
  })
})

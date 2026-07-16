import React from 'react'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { CompliancePage } from '@/features/compliance/front/pages/CompliancePage'

jest.mock('@/features/compliance/front/services/api', () => ({
  complianceApi: {
    getStatus: jest.fn(),
    getRuleset: jest.fn(),
    getRulesets: jest.fn(),
    getDeadlines: jest.fn(),
    getSubmissions: jest.fn(),
    getActiveSchoolYearId: jest.fn(),
    createDeadline: jest.fn(),
    updateDeadline: jest.fn(),
    deleteDeadline: jest.fn(),
    createSubmission: jest.fn(),
    updateSubmissionStatus: jest.fn(),
    deleteSubmission: jest.fn(),
    setConfig: jest.fn(),
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
const mockGetRulesets = complianceApi.getRulesets as jest.Mock
const mockGetDeadlines = complianceApi.getDeadlines as jest.Mock
const mockGetSubmissions = complianceApi.getSubmissions as jest.Mock
const mockGetActiveSchoolYearId = complianceApi.getActiveSchoolYearId as jest.Mock
const mockCreateDeadline = complianceApi.createDeadline as jest.Mock
const mockUpdateDeadline = complianceApi.updateDeadline as jest.Mock
const mockDeleteDeadline = complianceApi.deleteDeadline as jest.Mock
const mockCreateSubmission = complianceApi.createSubmission as jest.Mock
const mockUpdateSubmissionStatus = complianceApi.updateSubmissionStatus as jest.Mock
const mockDeleteSubmission = complianceApi.deleteSubmission as jest.Mock
const mockSetConfig = complianceApi.setConfig as jest.Mock
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
    mockGetRulesets.mockImplementation(() => ok([mockRuleset]))
    mockGetDeadlines.mockImplementation(() => ok(mockDeadlines))
    mockGetSubmissions.mockImplementation(() => ok(mockSubmissions))
    mockGetActiveSchoolYearId.mockImplementation(() => Promise.resolve('sy_active'))
    mockCreateDeadline.mockImplementation(() => ok(null))
    mockUpdateDeadline.mockImplementation(() => ok(null))
    mockDeleteDeadline.mockImplementation(() => ok(null))
    mockCreateSubmission.mockImplementation(() => ok(null))
    mockUpdateSubmissionStatus.mockImplementation(() => ok(null))
    mockDeleteSubmission.mockImplementation(() => ok(null))
    mockSetConfig.mockImplementation(() => ok(null))
  })

  afterEach(() => {
    mockUseHousehold.mockReset()
    mockGetStatus.mockReset()
    mockGetRuleset.mockReset()
    mockGetRulesets.mockReset()
    mockGetDeadlines.mockReset()
    mockGetSubmissions.mockReset()
    mockGetActiveSchoolYearId.mockReset()
    mockCreateDeadline.mockReset()
    mockUpdateDeadline.mockReset()
    mockDeleteDeadline.mockReset()
    mockCreateSubmission.mockReset()
    mockUpdateSubmissionStatus.mockReset()
    mockDeleteSubmission.mockReset()
    mockSetConfig.mockReset()
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

  it('does not show the Layer-1 illustrative banner now that status is computed from real records', async () => {
    render(<CompliancePage />)
    await waitFor(() => {
      expect(screen.getByTestId('compliance-status-hero')).toBeInTheDocument()
    })
    expect(screen.queryByTestId('compliance-illustrative-banner')).not.toBeInTheDocument()
    expect(screen.queryByText(/Sample data/i)).not.toBeInTheDocument()
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

  // ─── Phase 2: deadline / submission / config interactions ─────────────────
  it('adds a deadline via the collapsible add-form', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByTestId('add-deadline-toggle')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('add-deadline-toggle'))
    await waitFor(() => expect(screen.getByTestId('add-deadline-form')).toBeInTheDocument())
    fireEvent.change(screen.getByLabelText('Deadline label'), { target: { value: 'New filing' } })
    fireEvent.click(screen.getByRole('button', { name: 'Add deadline' }))
    await waitFor(() => expect(mockCreateDeadline).toHaveBeenCalledWith(
      expect.objectContaining({ schoolYearId: 'sy_active', label: 'New filing', requirementType: 'filing' }),
    ))
    await waitFor(() => expect(screen.getByText('Deadline added')).toBeInTheDocument())
  })

  it('marks a deadline complete', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByText('Annual Assessment Submission')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Mark deadline complete' }))
    await waitFor(() => expect(mockUpdateDeadline).toHaveBeenCalledWith('deadline_fix_001', { isCompleted: true }))
  })

  it('deletes a deadline through the styled confirmation (confirm path)', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByText('Annual Assessment Submission')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete deadline' })[0])
    await waitFor(() => expect(screen.getByText('Delete this deadline?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteDeadline).toHaveBeenCalledWith('deadline_fix_001'))
  })

  it('cancels a deadline delete without calling the API', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByText('Annual Assessment Submission')).toBeInTheDocument())
    fireEvent.click(screen.getAllByRole('button', { name: 'Delete deadline' })[0])
    await waitFor(() => expect(screen.getByText('Delete this deadline?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    await waitFor(() => expect(screen.queryByText('Delete this deadline?')).not.toBeInTheDocument())
    expect(mockDeleteDeadline).not.toHaveBeenCalled()
  })

  it('creates a submission', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByTestId('add-submission')).toBeInTheDocument())
    fireEvent.click(screen.getByTestId('add-submission'))
    await waitFor(() => expect(mockCreateSubmission).toHaveBeenCalledWith('sy_active'))
  })

  it('advances a submission status', async () => {
    mockGetSubmissions.mockImplementation(() => ok([
      { id: 'sub_draft', householdId: 'hh', schoolYearId: 'sy_active', status: 'drafted', submittedAt: null, acceptedAt: null, snapshotJson: null },
    ]))
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Mark sent' })).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Mark sent' }))
    await waitFor(() => expect(mockUpdateSubmissionStatus).toHaveBeenCalledWith('sub_draft', 'sent'))
  })

  it('deletes a submission through the styled confirmation', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByTestId('compliance-submissions')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete submission' }))
    await waitFor(() => expect(screen.getByText('Delete this submission?')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    await waitFor(() => expect(mockDeleteSubmission).toHaveBeenCalledWith('sub_fix_001'))
  })

  it('sets the active ruleset from the picker', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByTestId('compliance-ruleset')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    fireEvent.change(screen.getByLabelText('Active ruleset'), { target: { value: 'ruleset_fix_tx_001' } })
    fireEvent.click(screen.getByRole('button', { name: 'Save ruleset' }))
    await waitFor(() => expect(mockSetConfig).toHaveBeenCalledWith(
      expect.objectContaining({ activeRulesetId: 'ruleset_fix_tx_001' }),
    ))
  })

  it('disables deadline management when no active school year exists', async () => {
    mockGetActiveSchoolYearId.mockImplementation(() => Promise.resolve(null))
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByTestId('compliance-deadlines')).toBeInTheDocument())
    expect(screen.queryByTestId('add-deadline-toggle')).not.toBeInTheDocument()
    expect(screen.getByText(/set up a school year/i)).toBeInTheDocument()
  })

  // ─── G4: empty-state copy + info tooltips for ruleset/pathway ─────────────
  it('shows a helpful empty-state message instead of a bare empty ruleset selector when no rulesets exist', async () => {
    mockGetRulesets.mockImplementation(() => ok([]))
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByTestId('compliance-ruleset')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(screen.queryByLabelText('Active ruleset')).not.toBeInTheDocument()
    expect(screen.getByText(/no rulesets available yet/i)).toBeInTheDocument()
  })

  it('shows info tooltips next to the ruleset and pathway selectors when rulesets are present', async () => {
    render(<CompliancePage />)
    await waitFor(() => expect(screen.getByTestId('compliance-ruleset')).toBeInTheDocument())
    fireEvent.click(screen.getByRole('button', { name: 'Change' }))
    expect(screen.getByLabelText('Active ruleset')).toBeInTheDocument()
    const rulesetOptions = screen.getAllByRole('option')
    expect(rulesetOptions.length).toBeGreaterThan(1)
    expect(screen.getByTestId('ruleset-select-info')).toBeInTheDocument()
    expect(screen.getByTestId('pathway-info')).toBeInTheDocument()
  })
})

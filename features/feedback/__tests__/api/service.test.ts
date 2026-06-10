/** @jest-environment node */

jest.mock('@/features/feedback/server/repository', () => ({
  getFeedbackById: jest.fn(),
  listFeedbackForAdmin: jest.fn(),
  listFeedbackByPrNumber: jest.fn(),
  recordFeedbackApproval: jest.fn(),
  updateFeedbackTriage: jest.fn(),
  updateFeedbackWorkflow: jest.fn(),
}))

jest.mock('@/features/about/server/repository', () => ({
  getChangelogEntryByPrNumber: jest.fn(),
}))

import {
  getFeedbackById,
  listFeedbackForAdmin,
  listFeedbackByPrNumber,
  recordFeedbackApproval,
  updateFeedbackTriage,
  updateFeedbackWorkflow,
} from '@/features/feedback/server/repository'
import { getChangelogEntryByPrNumber } from '@/features/about/server/repository'
import {
  approveFeedbackForPlanning,
  applyClassification,
  listEligibleFeedbackForDailyRun,
  markFeedbackDuplicate,
  rejectForPlanning,
  markFeedbackAttachedToPr,
  rollbackFeedbackAttachedToPr,
  markFeedbackShippedByPr,
  resetClassification,
  type ClassifyDecision,
} from '@/features/feedback/server/service'
import type { FeedbackRow } from '@/features/feedback/types'

const mockGetFeedbackById = getFeedbackById as jest.Mock
const mockListFeedbackForAdmin = listFeedbackForAdmin as jest.Mock
const mockListFeedbackByPrNumber = listFeedbackByPrNumber as jest.Mock
const mockRecordFeedbackApproval = recordFeedbackApproval as jest.Mock
const mockUpdateFeedbackTriage = updateFeedbackTriage as jest.Mock
const mockUpdateFeedbackWorkflow = updateFeedbackWorkflow as jest.Mock
const mockGetChangelogEntryByPrNumber = getChangelogEntryByPrNumber as jest.Mock

function makeRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
    householdName: null,
    userEmail: 'user@example.com',
    pagePath: '/dashboard',
    sentiment: 'good',
    message: 'Helpful note',
    createdAt: '2026-05-25T11:40:00.000Z',
    status: 'submitted',
    featureArea: 'dashboard',
    feedbackType: 'ux',
    riskLevel: 'low',
    confidence: 'high',
    duplicateOfFeedbackId: null,
    adminApprovedAt: null,
    adminApprovedByUserId: null,
    prNumber: null,
    previewUrl: null,
    uatInstructions: null,
    versionResolved: null,
    resolvedAt: null,
    changelogEntryId: null,
    ...overrides,
  }
}

function makeClassifyDecision(overrides: Partial<ClassifyDecision> = {}): ClassifyDecision {
  return {
    status: 'reviewed',
    featureArea: 'dashboard',
    feedbackType: 'ux',
    riskLevel: 'low',
    confidence: 'high',
    recommendation: 'Clarify dashboard copy.',
    ...overrides,
  }
}

beforeEach(() => {
  mockGetFeedbackById.mockReset()
  mockListFeedbackForAdmin.mockReset()
  mockListFeedbackByPrNumber.mockReset()
  mockRecordFeedbackApproval.mockReset()
  mockUpdateFeedbackTriage.mockReset()
  mockUpdateFeedbackWorkflow.mockReset()
  mockGetChangelogEntryByPrNumber.mockReset()
})

describe('feedback service workflow rules', () => {
  it('approveFeedbackForPlanning moves awaiting_approval to classified', async () => {
    mockGetFeedbackById.mockResolvedValue(makeRow({ status: 'awaiting_approval' }))
    mockRecordFeedbackApproval.mockResolvedValue(undefined)
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await approveFeedbackForPlanning('fb_1', 'admin@example.com')

    expect(mockRecordFeedbackApproval).toHaveBeenCalledWith('fb_1', 'admin@example.com')
    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', { status: 'reviewed' })
  })

  it('approveFeedbackForPlanning rejects rows not awaiting approval', async () => {
    mockGetFeedbackById.mockResolvedValue(makeRow({ status: 'reviewed' }))

    await expect(approveFeedbackForPlanning('fb_1', 'admin@example.com')).rejects.toMatchObject({
      statusCode: 409,
      code: 'invalid_feedback_state',
    })

    expect(mockRecordFeedbackApproval).not.toHaveBeenCalled()
    expect(mockUpdateFeedbackTriage).not.toHaveBeenCalled()
  })

  it('high-confidence low-risk classification stays classified', async () => {
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await applyClassification('fb_1', makeClassifyDecision())

    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', {
      status: 'reviewed',
      featureArea: 'dashboard',
      feedbackType: 'ux',
      riskLevel: 'low',
      confidence: 'high',
      recommendation: 'Clarify dashboard copy.',
    })
  })

  it('higher-risk classification becomes awaiting_approval', async () => {
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await applyClassification('fb_1', makeClassifyDecision({ riskLevel: 'medium' }))

    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', {
      status: 'awaiting_approval',
      featureArea: 'dashboard',
      feedbackType: 'ux',
      riskLevel: 'medium',
      confidence: 'high',
      recommendation: 'Clarify dashboard copy.',
    })
  })

  it('markFeedbackDuplicate cancels the row and links the canonical feedback', async () => {
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await markFeedbackDuplicate('fb_1', 'fb_canonical')

    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', {
      status: 'cancelled',
      duplicateOfFeedbackId: 'fb_canonical',
    })
  })

  it('daily-run eligibility respects status, approval metadata, confidence, risk, and do-not-automate config', async () => {
    mockListFeedbackForAdmin.mockResolvedValue([
      makeRow({ id: 'fb_auto', status: 'reviewed', confidence: 'high', riskLevel: 'low' }),
      makeRow({
        id: 'fb_approved',
        status: 'reviewed',
        confidence: 'high',
        riskLevel: 'low',
        adminApprovedAt: '2026-05-25T11:45:00.000Z',
        adminApprovedByUserId: 'admin@example.com',
      }),
      makeRow({ id: 'fb_risky', status: 'reviewed', confidence: 'high', riskLevel: 'medium' }),
      makeRow({
        id: 'fb_approved_risky',
        status: 'reviewed',
        confidence: 'medium',
        riskLevel: 'medium',
        adminApprovedAt: '2026-05-25T12:00:00.000Z',
        adminApprovedByUserId: 'admin@example.com',
      }),
      makeRow({ id: 'fb_in_pr', status: 'reviewed', confidence: 'high', riskLevel: 'low', prNumber: 42 }),
      makeRow({ id: 'fb_blocked_feature', status: 'reviewed', featureArea: 'auth', confidence: 'high', riskLevel: 'low' }),
      makeRow({ id: 'fb_blocked_type', status: 'reviewed', feedbackType: 'performance', confidence: 'high', riskLevel: 'low' }),
      makeRow({ id: 'fb_wrong_status', status: 'awaiting_approval', confidence: 'high', riskLevel: 'low' }),
    ])

    const result = await listEligibleFeedbackForDailyRun({
      featureAreas: ['auth'],
      feedbackTypes: ['performance'],
    })

    expect(mockListFeedbackForAdmin).toHaveBeenCalledWith({ status: 'reviewed' })
    expect(result.feedbackIds).toEqual(['fb_auto', 'fb_approved', 'fb_approved_risky'])
    expect(result.autoEligibleIds).toEqual(['fb_auto'])
    expect(result.approvedIds).toEqual(['fb_approved', 'fb_approved_risky'])
  })
})

describe('rejectForPlanning', () => {
  it('sets feedback to cancelled', async () => {
    mockGetFeedbackById.mockResolvedValue(makeRow({ status: 'reviewed' }))
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await rejectForPlanning('fb_1')

    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', { status: 'cancelled' })
  })

  it('also rejects awaiting_approval rows', async () => {
    mockGetFeedbackById.mockResolvedValue(makeRow({ status: 'awaiting_approval' }))
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await rejectForPlanning('fb_1')

    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', { status: 'cancelled' })
  })

  it('throws when the row is already shipped', async () => {
    mockGetFeedbackById.mockResolvedValue(makeRow({ status: 'shipped' }))

    await expect(rejectForPlanning('fb_1')).rejects.toMatchObject({
      statusCode: 409,
      code: 'invalid_feedback_state',
    })

    expect(mockUpdateFeedbackTriage).not.toHaveBeenCalled()
  })

  it('throws when the row is not found', async () => {
    mockGetFeedbackById.mockResolvedValue(null)

    await expect(rejectForPlanning('fb_nonexistent')).rejects.toMatchObject({
      statusCode: 404,
      code: 'feedback_not_found',
    })

    expect(mockUpdateFeedbackTriage).not.toHaveBeenCalled()
  })
})

describe('markFeedbackAttachedToPr', () => {
  it('sets status to in_pr when no preview URL is provided', async () => {
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)

    await markFeedbackAttachedToPr('fb_1', {
      prNumber: 42,
      previewUrl: null,
      uatInstructions: 'Open PR preview and verify',
    })

    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_1', expect.objectContaining({
      status: 'in_pr',
      prNumber: 42,
      previewUrl: null,
    }))
  })

  it('sets status to in_qa when both preview URL and UAT instructions are present', async () => {
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)

    await markFeedbackAttachedToPr('fb_1', {
      prNumber: 42,
      previewUrl: 'https://sheathacademy-pr-42.onrender.com',
      uatInstructions: 'Open Render preview and verify button copy',
    })

    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_1', expect.objectContaining({
      status: 'in_qa',
      prNumber: 42,
      previewUrl: 'https://sheathacademy-pr-42.onrender.com',
    }))
  })

  it('does not store per-row changelog fields — only workflow state and UAT', async () => {
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)

    await markFeedbackAttachedToPr('fb_1', {
      prNumber: 42,
      previewUrl: null,
      uatInstructions: 'Open PR preview and verify',
    })

    const call = mockUpdateFeedbackWorkflow.mock.calls[0][1]
    expect(call).not.toHaveProperty('changelogLabel')
    expect(call).not.toHaveProperty('changelogUserCredit')
    expect(call).not.toHaveProperty('changelogVersion')
  })
})

describe('rollbackFeedbackAttachedToPr', () => {
  it('moves in_pr and in_qa rows back to classified and clears PR metadata', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({
        id: 'fb_1',
        prNumber: 42,
        status: 'in_pr',
        previewUrl: null,
        uatInstructions: 'Check PR copy',
      }),
      makeRow({
        id: 'fb_2',
        prNumber: 42,
        status: 'in_qa',
        previewUrl: 'https://sheathacademy-pr-42.onrender.com',
        uatInstructions: 'Open preview and verify',
      }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)

    await rollbackFeedbackAttachedToPr(42)

    expect(mockListFeedbackByPrNumber).toHaveBeenCalledWith(42)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledTimes(2)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_1', {
      status: 'reviewed',
      prNumber: null,
      previewUrl: null,
      uatInstructions: null,
      versionResolved: null,
      resolvedAt: null,
      changelogEntryId: null,
    })
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_2', {
      status: 'reviewed',
      prNumber: null,
      previewUrl: null,
      uatInstructions: null,
      versionResolved: null,
      resolvedAt: null,
      changelogEntryId: null,
    })
  })

  it('skips rows that are not attached to an active PR workflow state', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_classified', prNumber: 42, status: 'reviewed' }),
      makeRow({ id: 'fb_shipped', prNumber: 42, status: 'shipped' }),
      makeRow({ id: 'fb_eligible', prNumber: 42, status: 'in_pr' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)

    await rollbackFeedbackAttachedToPr(42)

    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledTimes(1)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_eligible', expect.anything())
    expect(mockUpdateFeedbackWorkflow).not.toHaveBeenCalledWith('fb_classified', expect.anything())
    expect(mockUpdateFeedbackWorkflow).not.toHaveBeenCalledWith('fb_shipped', expect.anything())
  })

  it('throws when no rollbackable rows exist for the PR', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'reviewed' }),
    ])

    await expect(rollbackFeedbackAttachedToPr(42)).rejects.toMatchObject({
      code: 'no_rollbackable_rows',
    })

    expect(mockUpdateFeedbackWorkflow).not.toHaveBeenCalled()
  })
})

describe('markFeedbackShippedByPr', () => {
  it('marks all in_pr and in_qa rows for the PR as shipped', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'in_pr' }),
      makeRow({ id: 'fb_2', prNumber: 42, status: 'in_qa' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)
    mockGetChangelogEntryByPrNumber.mockResolvedValue(null)

    await markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })

    expect(mockListFeedbackByPrNumber).toHaveBeenCalledWith(42)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledTimes(2)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_1', expect.objectContaining({
      status: 'shipped',
      versionResolved: '2.1.0',
    }))
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_2', expect.objectContaining({
      status: 'shipped',
      versionResolved: '2.1.0',
    }))
  })

  it('looks up existing changelog entry by PR number to link rows', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'in_pr' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)
    mockGetChangelogEntryByPrNumber.mockResolvedValue({
      id: 'cl_existing',
      version: '2.1.0',
      label: 'Dashboard fix',
      detail: '',
      source: 'steward',
      prNumber: 42,
      userCredit: null,
      status: 'pending',
      createdAt: '2026-05-25T15:58:00.000Z',
    })

    await markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })

    expect(mockGetChangelogEntryByPrNumber).toHaveBeenCalledWith(42)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_1', expect.objectContaining({
      changelogEntryId: 'cl_existing',
    }))
  })

  it('ships rows without changelogEntryId when no changelog entry exists for the PR', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'in_pr' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)
    mockGetChangelogEntryByPrNumber.mockResolvedValue(null)

    await markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })

    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_1', expect.not.objectContaining({
      changelogEntryId: expect.any(String),
    }))
  })

  it('both rows get the same changelogEntryId backlink', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'in_pr' }),
      makeRow({ id: 'fb_2', prNumber: 42, status: 'in_qa' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)
    mockGetChangelogEntryByPrNumber.mockResolvedValue({
      id: 'cl_existing',
      version: '2.1.0',
      label: 'Dashboard fix',
      detail: '',
      source: 'steward',
      prNumber: 42,
      userCredit: null,
      status: 'pending',
      createdAt: '2026-05-25T15:58:00.000Z',
    })

    await markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })

    const call1EntryId = mockUpdateFeedbackWorkflow.mock.calls.find(c => c[0] === 'fb_1')?.[1].changelogEntryId
    const call2EntryId = mockUpdateFeedbackWorkflow.mock.calls.find(c => c[0] === 'fb_2')?.[1].changelogEntryId
    expect(call1EntryId).toBe('cl_existing')
    expect(call1EntryId).toEqual(call2EntryId)
  })

  it('does not call insertChangelogEntry — changelog creation is run-daily\'s job', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'in_pr' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)
    mockGetChangelogEntryByPrNumber.mockResolvedValue(null)

    await markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })

    // insertChangelogEntry is not even imported — this test confirms the service
    // doesn't call it by checking the about/repository mock has no unexpected calls
    expect(mockGetChangelogEntryByPrNumber).toHaveBeenCalledTimes(1)
  })

  it('skips rows that are not in_pr or in_qa', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_already_shipped', prNumber: 42, status: 'shipped' }),
      makeRow({ id: 'fb_eligible', prNumber: 42, status: 'in_qa' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)
    mockGetChangelogEntryByPrNumber.mockResolvedValue(null)

    await markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })

    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledTimes(1)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_eligible', expect.anything())
    expect(mockUpdateFeedbackWorkflow).not.toHaveBeenCalledWith('fb_already_shipped', expect.anything())
  })

  it('throws when no in_pr or in_qa rows exist for the PR', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'shipped' }),
    ])

    await expect(markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })).rejects.toMatchObject({
      code: 'no_shippable_rows',
    })

    expect(mockUpdateFeedbackWorkflow).not.toHaveBeenCalled()
  })

  it('throws when no rows exist for the PR at all', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([])

    await expect(markFeedbackShippedByPr(42, { versionResolved: '2.1.0' })).rejects.toMatchObject({
      code: 'no_shippable_rows',
    })

    expect(mockUpdateFeedbackWorkflow).not.toHaveBeenCalled()
  })
})

describe('resetClassification', () => {
  it('resets each id back to submitted and clears all triage fields', async () => {
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await resetClassification(['fb_1', 'fb_2'])

    expect(mockUpdateFeedbackTriage).toHaveBeenCalledTimes(2)
    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', {
      status: 'submitted',
      featureArea: null,
      feedbackType: null,
      riskLevel: null,
      confidence: null,
      recommendation: null,
      duplicateOfFeedbackId: null,
    })
    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_2', {
      status: 'submitted',
      featureArea: null,
      feedbackType: null,
      riskLevel: null,
      confidence: null,
      recommendation: null,
      duplicateOfFeedbackId: null,
    })
  })

  it('does nothing when given an empty list', async () => {
    await resetClassification([])
    expect(mockUpdateFeedbackTriage).not.toHaveBeenCalled()
  })
})


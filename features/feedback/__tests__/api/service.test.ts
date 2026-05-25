/** @jest-environment node */

jest.mock('@/features/feedback/server/repository', () => ({
  getFeedbackById: jest.fn(),
  listFeedbackForAdmin: jest.fn(),
  listFeedbackByPrNumber: jest.fn(),
  recordFeedbackApproval: jest.fn(),
  updateFeedbackTriage: jest.fn(),
  updateFeedbackWorkflow: jest.fn(),
}))

import {
  getFeedbackById,
  listFeedbackForAdmin,
  listFeedbackByPrNumber,
  recordFeedbackApproval,
  updateFeedbackTriage,
  updateFeedbackWorkflow,
} from '@/features/feedback/server/repository'
import {
  approveFeedbackForPlanning,
  applyClassification,
  listEligibleFeedbackForDailyRun,
  markFeedbackDuplicate,
  markFeedbackAttachedToPr,
  markFeedbackShippedByPr,
  type ClassifyDecision,
} from '@/features/feedback/server/service'
import type { FeedbackRow } from '@/features/feedback/types'

const mockGetFeedbackById = getFeedbackById as jest.Mock
const mockListFeedbackForAdmin = listFeedbackForAdmin as jest.Mock
const mockListFeedbackByPrNumber = listFeedbackByPrNumber as jest.Mock
const mockRecordFeedbackApproval = recordFeedbackApproval as jest.Mock
const mockUpdateFeedbackTriage = updateFeedbackTriage as jest.Mock
const mockUpdateFeedbackWorkflow = updateFeedbackWorkflow as jest.Mock

function makeRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
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
    changelogVersion: null,
    changelogLabel: null,
    changelogUserCredit: null,
    ...overrides,
  }
}

function makeClassifyDecision(overrides: Partial<ClassifyDecision> = {}): ClassifyDecision {
  return {
    status: 'classified',
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
})

describe('feedback service workflow rules', () => {
  it('approveFeedbackForPlanning moves awaiting_approval to classified', async () => {
    mockGetFeedbackById.mockResolvedValue(makeRow({ status: 'awaiting_approval' }))
    mockRecordFeedbackApproval.mockResolvedValue(undefined)
    mockUpdateFeedbackTriage.mockResolvedValue(undefined)

    await approveFeedbackForPlanning('fb_1', 'admin@example.com')

    expect(mockRecordFeedbackApproval).toHaveBeenCalledWith('fb_1', 'admin@example.com')
    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', { status: 'classified' })
  })

  it('approveFeedbackForPlanning rejects rows not awaiting approval', async () => {
    mockGetFeedbackById.mockResolvedValue(makeRow({ status: 'classified' }))

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
      status: 'classified',
      featureArea: 'dashboard',
      feedbackType: 'ux',
      riskLevel: 'low',
      confidence: 'high',
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
      makeRow({ id: 'fb_auto', status: 'classified', confidence: 'high', riskLevel: 'low' }),
      makeRow({
        id: 'fb_approved',
        status: 'classified',
        confidence: 'high',
        riskLevel: 'low',
        adminApprovedAt: '2026-05-25T11:45:00.000Z',
        adminApprovedByUserId: 'admin@example.com',
      }),
      makeRow({ id: 'fb_risky', status: 'classified', confidence: 'high', riskLevel: 'medium' }),
      makeRow({
        id: 'fb_approved_risky',
        status: 'classified',
        confidence: 'medium',
        riskLevel: 'medium',
        adminApprovedAt: '2026-05-25T12:00:00.000Z',
        adminApprovedByUserId: 'admin@example.com',
      }),
      makeRow({ id: 'fb_in_pr', status: 'classified', confidence: 'high', riskLevel: 'low', prNumber: 42 }),
      makeRow({ id: 'fb_blocked_feature', status: 'classified', featureArea: 'auth', confidence: 'high', riskLevel: 'low' }),
      makeRow({ id: 'fb_blocked_type', status: 'classified', feedbackType: 'performance', confidence: 'high', riskLevel: 'low' }),
      makeRow({ id: 'fb_wrong_status', status: 'awaiting_approval', confidence: 'high', riskLevel: 'low' }),
    ])

    const result = await listEligibleFeedbackForDailyRun({
      featureAreas: ['auth'],
      feedbackTypes: ['performance'],
    })

    expect(mockListFeedbackForAdmin).toHaveBeenCalledWith({ status: 'classified' })
    expect(result.feedbackIds).toEqual(['fb_auto', 'fb_approved', 'fb_approved_risky'])
    expect(result.autoEligibleIds).toEqual(['fb_auto'])
    expect(result.approvedIds).toEqual(['fb_approved', 'fb_approved_risky'])
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
})

describe('markFeedbackShippedByPr', () => {
  it('marks all in_pr and in_qa rows for the PR as shipped', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_1', prNumber: 42, status: 'in_pr' }),
      makeRow({ id: 'fb_2', prNumber: 42, status: 'in_qa' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)

    await markFeedbackShippedByPr(42, { versionResolved: '2.1.0', changelogVersion: '2.1.0' })

    expect(mockListFeedbackByPrNumber).toHaveBeenCalledWith(42)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledTimes(2)
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_1', expect.objectContaining({
      status: 'shipped',
      versionResolved: '2.1.0',
      changelogVersion: '2.1.0',
    }))
    expect(mockUpdateFeedbackWorkflow).toHaveBeenCalledWith('fb_2', expect.objectContaining({
      status: 'shipped',
      versionResolved: '2.1.0',
      changelogVersion: '2.1.0',
    }))
  })

  it('skips rows that are not in_pr or in_qa', async () => {
    mockListFeedbackByPrNumber.mockResolvedValue([
      makeRow({ id: 'fb_already_shipped', prNumber: 42, status: 'shipped' }),
      makeRow({ id: 'fb_eligible', prNumber: 42, status: 'in_qa' }),
    ])
    mockUpdateFeedbackWorkflow.mockResolvedValue(undefined)

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

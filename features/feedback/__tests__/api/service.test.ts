/** @jest-environment node */

jest.mock('@/features/feedback/server/repository', () => ({
  getFeedbackById: jest.fn(),
  listFeedbackForAdmin: jest.fn(),
  recordFeedbackApproval: jest.fn(),
  updateFeedbackTriage: jest.fn(),
}))

import {
  getFeedbackById,
  listFeedbackForAdmin,
  recordFeedbackApproval,
  updateFeedbackTriage,
} from '@/features/feedback/server/repository'
import {
  approveFeedbackForPlanning,
  applyClassification,
  listEligibleFeedbackForDailyRun,
  markFeedbackDuplicate,
  type ClassifyDecision,
} from '@/features/feedback/server/service'
import type { FeedbackRow } from '@/features/feedback/types'

const mockGetFeedbackById = getFeedbackById as jest.Mock
const mockListFeedbackForAdmin = listFeedbackForAdmin as jest.Mock
const mockRecordFeedbackApproval = recordFeedbackApproval as jest.Mock
const mockUpdateFeedbackTriage = updateFeedbackTriage as jest.Mock

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
  mockRecordFeedbackApproval.mockReset()
  mockUpdateFeedbackTriage.mockReset()
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
    expect(result.feedbackIds).toEqual(['fb_auto', 'fb_approved'])
    expect(result.autoEligibleIds).toEqual(['fb_auto'])
    expect(result.approvedIds).toEqual(['fb_approved'])
  })
})

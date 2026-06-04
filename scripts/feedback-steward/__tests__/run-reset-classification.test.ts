/** @jest-environment node */

jest.mock('@/features/feedback/server/repository', () => ({
  listFeedback: jest.fn(),
}))

jest.mock('@/features/feedback/server/service', () => ({
  resetClassification: jest.fn(),
}))

import { listFeedback } from '@/features/feedback/server/repository'
import { resetClassification } from '@/features/feedback/server/service'
import { runResetClassification } from '../run-reset-classification'
import type { FeedbackRow } from '@/features/feedback/types'

const mockListFeedback = listFeedback as jest.MockedFunction<typeof listFeedback>
const mockResetClassification = resetClassification as jest.MockedFunction<typeof resetClassification>

function makeRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: null,
    householdName: null,
    userEmail: 'user@example.com',
    pagePath: '/dashboard',
    sentiment: 'poor',
    message: 'Something is broken',
    createdAt: '2026-06-04T10:00:00.000Z',
    status: 'reviewed',
    featureArea: 'dashboard',
    feedbackType: 'ux',
    riskLevel: 'low',
    confidence: 'high',
    recommendation: 'Fix it',
    duplicateOfFeedbackId: null,
    adminApprovedAt: null,
    adminApprovedByUserId: null,
    prNumber: null,
    previewUrl: null,
    uatInstructions: null,
    versionResolved: null,
    resolvedAt: null,
    changelogEntryId: null,
    changelogEntryLabel: null,
    changelogEntryUserCredit: null,
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockResetClassification.mockResolvedValue(undefined)
})

describe('runResetClassification', () => {
  it('dry-run returns rows that would be reset without calling resetClassification', async () => {
    mockListFeedback.mockResolvedValue([
      makeRow({ id: 'fb_1', status: 'reviewed' }),
      makeRow({ id: 'fb_2', status: 'awaiting_approval' }),
    ] as never)

    const result = await runResetClassification({ dryRun: true, includeCancelled: false })

    expect(result.dryRun).toBe(true)
    expect(result.resetIds).toEqual(expect.arrayContaining(['fb_1', 'fb_2']))
    expect(mockResetClassification).not.toHaveBeenCalled()
  })

  it('resets classified and awaiting_approval rows that have no PR', async () => {
    mockListFeedback.mockResolvedValue([
      makeRow({ id: 'fb_1', status: 'reviewed', prNumber: null }),
      makeRow({ id: 'fb_2', status: 'awaiting_approval', prNumber: null }),
    ] as never)

    const result = await runResetClassification({ dryRun: false, includeCancelled: false })

    expect(mockResetClassification).toHaveBeenCalledWith(['fb_1', 'fb_2'])
    expect(result.resetIds).toEqual(expect.arrayContaining(['fb_1', 'fb_2']))
  })

  it('skips rows that already have a PR number attached', async () => {
    mockListFeedback.mockResolvedValue([
      makeRow({ id: 'fb_in_pr', status: 'in_pr', prNumber: 42 }),
      makeRow({ id: 'fb_classified', status: 'reviewed', prNumber: null }),
    ] as never)

    const result = await runResetClassification({ dryRun: false, includeCancelled: false })

    expect(result.resetIds).toEqual(['fb_classified'])
    expect(mockResetClassification).toHaveBeenCalledWith(['fb_classified'])
  })

  it('excludes cancelled rows by default', async () => {
    mockListFeedback.mockResolvedValue([
      makeRow({ id: 'fb_dup', status: 'cancelled', duplicateOfFeedbackId: 'fb_other' }),
      makeRow({ id: 'fb_ok', status: 'reviewed' }),
    ] as never)

    const result = await runResetClassification({ dryRun: false, includeCancelled: false })

    expect(result.resetIds).toEqual(['fb_ok'])
  })

  it('includes cancelled rows when includeCancelled is true', async () => {
    mockListFeedback.mockResolvedValue([
      makeRow({ id: 'fb_dup', status: 'cancelled', duplicateOfFeedbackId: 'fb_other', prNumber: null }),
      makeRow({ id: 'fb_ok', status: 'reviewed', prNumber: null }),
    ] as never)

    const result = await runResetClassification({ dryRun: false, includeCancelled: true })

    expect(result.resetIds).toEqual(expect.arrayContaining(['fb_dup', 'fb_ok']))
    expect(mockResetClassification).toHaveBeenCalledWith(expect.arrayContaining(['fb_dup', 'fb_ok']))
  })

  it('returns empty resetIds and does not call resetClassification when nothing to reset', async () => {
    mockListFeedback.mockResolvedValue([
      makeRow({ id: 'fb_shipped', status: 'shipped' }),
      makeRow({ id: 'fb_submitted', status: 'submitted' }),
    ] as never)

    const result = await runResetClassification({ dryRun: false, includeCancelled: false })

    expect(result.resetIds).toHaveLength(0)
    expect(mockResetClassification).not.toHaveBeenCalled()
  })
})

/** @jest-environment node */

jest.mock('@/features/feedback/server/repository', () => ({
  listUnclassifiedFeedback: jest.fn(),
}))

import { listUnclassifiedFeedback } from '@/features/feedback/server/repository'
import { getUnclassifiedFeedback } from '../feedback-requeue'

const mockListUnclassifiedFeedback = listUnclassifiedFeedback as jest.MockedFunction<typeof listUnclassifiedFeedback>

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: null,
    userEmail: 'test@example.com',
    pagePath: '/dashboard',
    sentiment: 'bad',
    message: 'The dashboard is broken',
    createdAt: '2026-05-25T10:00:00.000Z',
    status: 'submitted',
    featureArea: null,
    feedbackType: null,
    riskLevel: null,
    confidence: null,
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

beforeEach(() => jest.clearAllMocks())

describe('getUnclassifiedFeedback', () => {
  it('returns mapped items for submitted rows', async () => {
    mockListUnclassifiedFeedback.mockResolvedValue([makeRow()] as never)

    const items = await getUnclassifiedFeedback()

    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('fb_1')
    expect(items[0].message).toBe('The dashboard is broken')
    expect(items[0].pagePath).toBe('/dashboard')
    expect(items[0].sentiment).toBe('bad')
    expect(items[0].createdAt).toBe('2026-05-25T10:00:00.000Z')
    expect(items[0].userId).toBe('user_1')
    expect(items[0].userEmail).toBe('test@example.com')
  })

  it('returns empty array when no unclassified rows', async () => {
    mockListUnclassifiedFeedback.mockResolvedValue([] as never)

    const items = await getUnclassifiedFeedback()

    expect(items).toEqual([])
  })

  it('handles null message', async () => {
    mockListUnclassifiedFeedback.mockResolvedValue([makeRow({ message: null })] as never)

    const items = await getUnclassifiedFeedback()

    expect(items[0].message).toBeNull()
  })

  it('output shape matches FeedbackRequeueItem spec', async () => {
    mockListUnclassifiedFeedback.mockResolvedValue([makeRow()] as never)

    const items = await getUnclassifiedFeedback()

    expect(mockListUnclassifiedFeedback).toHaveBeenCalledTimes(1)
    expect(Object.keys(items[0]).sort()).toEqual(
      ['createdAt', 'id', 'message', 'pagePath', 'sentiment', 'userId', 'userEmail'].sort()
    )
  })
})

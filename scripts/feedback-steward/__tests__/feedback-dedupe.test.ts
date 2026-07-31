/** @jest-environment node */

jest.mock('@/features/feedback/server/repository', () => ({
  getFeedbackById: jest.fn(),
  listFeedback: jest.fn(),
}))

import { getFeedbackById, listFeedback } from '@/features/feedback/server/repository'
import { detectDuplicate, detectDuplicatesBatch } from '../feedback-dedupe'

const mockGetFeedbackById = getFeedbackById as jest.MockedFunction<typeof getFeedbackById>
const mockListFeedback = listFeedback as jest.MockedFunction<typeof listFeedback>

function makeRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: null,
    userEmail: 'test@example.com',
    pagePath: '/attendance',
    sentiment: 'bad',
    message: 'The attendance page shows wrong dates',
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

describe('detectDuplicate', () => {
  it('returns isDuplicate=false when candidate not found', async () => {
    mockGetFeedbackById.mockResolvedValue(null)
    mockListFeedback.mockResolvedValue([] as never)

    const result = await detectDuplicate('fb_missing')

    expect(result.isDuplicate).toBe(false)
    expect(result.duplicateOfId).toBeNull()
  })

  it('detects duplicate by PR number match on a non-cancelled row', async () => {
    const candidate = makeRow({ id: 'fb_new', prNumber: 42 })
    const existing = makeRow({ id: 'fb_old', prNumber: 42, status: 'reviewed' })
    mockGetFeedbackById.mockResolvedValue(candidate as never)
    mockListFeedback.mockResolvedValue([candidate, existing] as never)

    const result = await detectDuplicate('fb_new')

    expect(result).toEqual({
      isDuplicate: true,
      duplicateOfId: 'fb_old',
      reason: 'matching_pr_number',
    })
  })

  it('ignores cancelled rows for PR-based duplicate detection', async () => {
    const candidate = makeRow({ id: 'fb_new', prNumber: 42 })
    const cancelled = makeRow({ id: 'fb_old', prNumber: 42, status: 'cancelled' })
    mockGetFeedbackById.mockResolvedValue(candidate as never)
    mockListFeedback.mockResolvedValue([candidate, cancelled] as never)

    const result = await detectDuplicate('fb_new')

    expect(result.isDuplicate).toBe(false)
  })

  it('detects duplicate by message similarity when the canonical row is already triaged', async () => {
    const candidate = makeRow({
      id: 'fb_new',
      message: 'The attendance page shows wrong dates after daylight saving time',
    })
    const existing = makeRow({
      id: 'fb_old',
      message: 'Attendance page shows wrong dates after daylight saving',
      status: 'reviewed',
    })
    mockGetFeedbackById.mockResolvedValue(candidate as never)
    mockListFeedback.mockResolvedValue([candidate, existing] as never)

    const result = await detectDuplicate('fb_new')

    expect(result).toEqual({
      isDuplicate: true,
      duplicateOfId: 'fb_old',
      reason: 'message_similarity',
    })
  })

  it('ignores submitted rows for message-based duplicate detection', async () => {
    const candidate = makeRow({
      id: 'fb_new',
      message: 'The attendance page shows wrong dates after daylight saving time',
    })
    const submitted = makeRow({
      id: 'fb_old',
      message: 'Attendance page shows wrong dates after daylight saving',
      status: 'submitted',
    })
    mockGetFeedbackById.mockResolvedValue(candidate as never)
    mockListFeedback.mockResolvedValue([candidate, submitted] as never)

    const result = await detectDuplicate('fb_new')

    expect(result.isDuplicate).toBe(false)
  })

  it('ignores cancelled rows for message-based duplicate detection', async () => {
    const candidate = makeRow({
      id: 'fb_new',
      message: 'The attendance page shows wrong dates after daylight saving time',
    })
    const cancelled = makeRow({
      id: 'fb_old',
      message: 'Attendance page shows wrong dates after daylight saving',
      status: 'cancelled',
    })
    mockGetFeedbackById.mockResolvedValue(candidate as never)
    mockListFeedback.mockResolvedValue([candidate, cancelled] as never)

    const result = await detectDuplicate('fb_new')

    expect(result.isDuplicate).toBe(false)
  })

  it('returns isDuplicate=false when messages are dissimilar', async () => {
    const candidate = makeRow({ id: 'fb_new', message: 'Login button not working on mobile' })
    const existing = makeRow({ id: 'fb_old', message: 'Dashboard shows wrong chart data', status: 'reviewed' })
    mockGetFeedbackById.mockResolvedValue(candidate as never)
    mockListFeedback.mockResolvedValue([candidate, existing] as never)

    const result = await detectDuplicate('fb_new')

    expect(result.isDuplicate).toBe(false)
    expect(result.duplicateOfId).toBeNull()
  })

  it('returns isDuplicate=false when candidate has no message', async () => {
    const candidate = makeRow({ id: 'fb_new', message: null, prNumber: null })
    mockGetFeedbackById.mockResolvedValue(candidate as never)
    mockListFeedback.mockResolvedValue([candidate] as never)

    const result = await detectDuplicate('fb_new')

    expect(result.isDuplicate).toBe(false)
  })
})

function makeRequeueItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'fb_1',
    message: 'The attendance page shows wrong dates',
    pagePath: '/attendance',
    sentiment: 'bad',
    createdAt: '2026-05-25T10:00:00.000Z',
    userId: 'user_1',
    userEmail: 'test@example.com',
    hasScreenshot: false,
    ...overrides,
  }
}

describe('detectDuplicatesBatch', () => {
  it('returns an empty map for empty candidates without querying the DB', async () => {
    const result = await detectDuplicatesBatch([])

    expect(result.size).toBe(0)
    expect(mockListFeedback).not.toHaveBeenCalled()
  })

  it('fetches existing rows only once regardless of how many candidates there are', async () => {
    mockListFeedback.mockResolvedValue([] as never)

    await detectDuplicatesBatch([
      makeRequeueItem({ id: 'fb_1' }),
      makeRequeueItem({ id: 'fb_2', message: 'Dashboard chart is wrong' }),
    ])

    expect(mockListFeedback).toHaveBeenCalledTimes(1)
    expect(mockGetFeedbackById).not.toHaveBeenCalled()
  })

  it('marks a candidate as duplicate when its message matches an existing classified row', async () => {
    const existing = makeRow({
      id: 'fb_old',
      message: 'Attendance page shows wrong dates after daylight saving',
      status: 'reviewed',
    })
    mockListFeedback.mockResolvedValue([existing] as never)

    const result = await detectDuplicatesBatch([
      makeRequeueItem({
        id: 'fb_new',
        message: 'The attendance page shows wrong dates after daylight saving time',
      }),
    ])

    expect(result.get('fb_new')).toEqual({
      isDuplicate: true,
      duplicateOfId: 'fb_old',
      reason: 'message_similarity',
    })
  })

  it('returns not-duplicate for items with dissimilar messages', async () => {
    const existing = makeRow({ id: 'fb_old', message: 'Dashboard chart is broken', status: 'reviewed' })
    mockListFeedback.mockResolvedValue([existing] as never)

    const result = await detectDuplicatesBatch([
      makeRequeueItem({ id: 'fb_new', message: 'Login button not working on mobile' }),
    ])

    expect(result.get('fb_new')).toEqual({ isDuplicate: false, duplicateOfId: null, reason: null })
  })

  it('returns a result for every candidate', async () => {
    mockListFeedback.mockResolvedValue([] as never)

    const result = await detectDuplicatesBatch([
      makeRequeueItem({ id: 'fb_1' }),
      makeRequeueItem({ id: 'fb_2', message: 'Something else entirely' }),
    ])

    expect(result.has('fb_1')).toBe(true)
    expect(result.has('fb_2')).toBe(true)
  })

  it('ignores submitted and cancelled rows when checking for message duplicates', async () => {
    const submitted = makeRow({ id: 'fb_old', message: 'The attendance page shows wrong dates after daylight saving', status: 'submitted' })
    const cancelled = makeRow({ id: 'fb_cancelled', message: 'The attendance page shows wrong dates after daylight saving', status: 'cancelled' })
    mockListFeedback.mockResolvedValue([submitted, cancelled] as never)

    const result = await detectDuplicatesBatch([
      makeRequeueItem({ id: 'fb_new', message: 'The attendance page shows wrong dates after daylight saving time' }),
    ])

    expect(result.get('fb_new')!.isDuplicate).toBe(false)
  })
})

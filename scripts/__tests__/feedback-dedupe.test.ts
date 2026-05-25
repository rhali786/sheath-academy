/** @jest-environment node */

jest.mock('@/features/feedback/server/repository', () => ({
  getFeedbackById: jest.fn(),
  listFeedback: jest.fn(),
}))

import { getFeedbackById, listFeedback } from '@/features/feedback/server/repository'
import { detectDuplicate } from '../feedback-dedupe'

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
    const existing = makeRow({ id: 'fb_old', prNumber: 42, status: 'classified' })
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
      status: 'classified',
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
    const existing = makeRow({ id: 'fb_old', message: 'Dashboard shows wrong chart data', status: 'classified' })
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

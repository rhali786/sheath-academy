/** @jest-environment node */

jest.mock('fs', () => ({
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

jest.mock('@/features/feedback/server/repository', () => ({
  listFeedbackForAdmin: jest.fn(),
}))

import { existsSync, mkdirSync, writeFileSync } from 'fs'
import { listFeedbackForAdmin } from '@/features/feedback/server/repository'
import { runFeedbackNotify, type NotifySummary } from '../feedback-notify'
import type { FeedbackRow } from '@/features/feedback/types'

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>
const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>
const mockListFeedbackForAdmin = listFeedbackForAdmin as jest.MockedFunction<typeof listFeedbackForAdmin>

function makeShippedRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
    householdName: null,
    userEmail: 'parent@example.com',
    pagePath: '/dashboard',
    sentiment: 'good',
    message: 'Button copy was confusing',
    createdAt: '2026-05-25T10:00:00Z',
    status: 'shipped',
    featureArea: 'dashboard',
    feedbackType: 'ux',
    riskLevel: 'low',
    confidence: 'high',
    duplicateOfFeedbackId: null,
    adminApprovedAt: null,
    adminApprovedByUserId: null,
    prNumber: 42,
    previewUrl: 'https://preview.example.com',
    uatInstructions: 'Check button copy',
    versionResolved: '2.1.0',
    resolvedAt: '2026-05-25T18:00:00Z',
    changelogVersion: '2.1.0',
    changelogLabel: 'Dashboard copy polish',
    changelogUserCredit: 'parent@example.com',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockExistsSync.mockReturnValue(false)
})

describe('runFeedbackNotify', () => {
  it('queries shipped rows and writes a summary artifact', async () => {
    mockListFeedbackForAdmin.mockResolvedValue([
      makeShippedRow({ id: 'fb_1', userEmail: 'parent@example.com', versionResolved: '2.1.0' }),
      makeShippedRow({ id: 'fb_2', userEmail: 'other@example.com', versionResolved: '2.1.0' }),
    ])

    const result = await runFeedbackNotify({ sinceHours: 24, now: new Date('2026-05-25T20:00:00Z') })

    expect(mockListFeedbackForAdmin).toHaveBeenCalledWith({ status: 'shipped' })
    expect(result.shippedCount).toBe(2)
    expect(result.rows).toHaveLength(2)
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
    expect(mockMkdirSync).toHaveBeenCalled()
  })

  it('filters rows to only those shipped within sinceHours', async () => {
    mockListFeedbackForAdmin.mockResolvedValue([
      makeShippedRow({ id: 'fb_recent', resolvedAt: '2026-05-25T18:00:00Z' }),
      makeShippedRow({ id: 'fb_old', resolvedAt: '2026-05-24T10:00:00Z' }),
    ])

    const result = await runFeedbackNotify({ sinceHours: 24, now: new Date('2026-05-25T20:00:00Z') })

    expect(result.shippedCount).toBe(1)
    expect(result.rows[0].id).toBe('fb_recent')
  })

  it('returns empty summary and writes artifact when no recently shipped rows', async () => {
    mockListFeedbackForAdmin.mockResolvedValue([
      makeShippedRow({ id: 'fb_old', resolvedAt: '2026-05-23T10:00:00Z' }),
    ])

    const result = await runFeedbackNotify({ sinceHours: 24, now: new Date('2026-05-25T20:00:00Z') })

    expect(result.shippedCount).toBe(0)
    expect(result.rows).toHaveLength(0)
    expect(mockWriteFileSync).toHaveBeenCalledTimes(1)
  })

  it('includes submitter emails grouped by version in the summary', async () => {
    mockListFeedbackForAdmin.mockResolvedValue([
      makeShippedRow({ id: 'fb_1', userEmail: 'a@example.com', versionResolved: '2.1.0', resolvedAt: '2026-05-25T18:00:00Z' }),
      makeShippedRow({ id: 'fb_2', userEmail: 'b@example.com', versionResolved: '2.1.0', resolvedAt: '2026-05-25T18:00:00Z' }),
    ])

    const result = await runFeedbackNotify({ sinceHours: 24, now: new Date('2026-05-25T20:00:00Z') })

    expect(result.byVersion['2.1.0']).toEqual(
      expect.arrayContaining(['a@example.com', 'b@example.com'])
    )
  })
})

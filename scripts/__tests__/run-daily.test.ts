/** @jest-environment node */

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}))

jest.mock('fs', () => ({
  existsSync: jest.fn(() => true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
}))

jest.mock('@/features/feedback/server/service', () => ({
  listEligibleFeedbackForDailyRun: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { listEligibleFeedbackForDailyRun } from '@/features/feedback/server/service'
import { parseDailyPlanOutput, runDaily } from '../run-daily'
import type { FeedbackRow } from '@/features/feedback/types'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>
const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>
const mockListEligibleFeedbackForDailyRun = listEligibleFeedbackForDailyRun as jest.MockedFunction<
  typeof listEligibleFeedbackForDailyRun
>

function makeRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
    userEmail: 'user@example.com',
    pagePath: '/dashboard',
    sentiment: 'good',
    message: 'Clarify the dashboard button copy',
    createdAt: '2026-05-25T11:40:00.000Z',
    status: 'classified',
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

function makePlanArtifact() {
  return {
    version: 1,
    generatedAt: '2026-05-25T15:58:00.000Z',
    feedbackIds: ['fb_1', 'fb_2'],
    eligibilitySnapshot: {
      autoEligibleIds: ['fb_1'],
      approvedIds: ['fb_2'],
    },
    workstreams: [
      {
        featureArea: 'dashboard',
        summary: 'Tighten dashboard feedback fixes',
        allowedFiles: ['features/dashboard/**', 'features/feedback/**'],
        testPlan: ['npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx'],
        uatByFeedbackId: {
          fb_1: ['Open Render preview', 'Visit dashboard', 'Verify updated button copy'],
          fb_2: ['Open Render preview', 'Visit dashboard', 'Verify updated helper text'],
        },
      },
    ],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockExistsSync.mockReturnValue(true)
  mockReadFileSync.mockImplementation((path: any) => {
    const normalized = String(path).replace(/\\/g, '/')
    if (normalized.endsWith('/.claude/feedback-daily-plan.md')) {
      return '# daily plan skill' as never
    }
    if (normalized.endsWith('/config/feedback-steward/do-not-automate.json')) {
      return JSON.stringify({ featureAreas: ['auth'], feedbackTypes: ['performance'] }) as never
    }
    throw new Error(`Unexpected readFileSync path: ${normalized}`)
  })
})

describe('parseDailyPlanOutput', () => {
  it('parses direct JSON plan output', () => {
    expect(parseDailyPlanOutput(JSON.stringify(makePlanArtifact()))).toEqual(makePlanArtifact())
  })

  it('returns null for invalid plan output', () => {
    expect(parseDailyPlanOutput(JSON.stringify({ version: 1, feedbackIds: [] }))).toBeNull()
  })
})

describe('runDaily', () => {
  it('dry-run writes plan artifact only', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1', 'fb_2'],
      autoEligibleIds: ['fb_1'],
      approvedIds: ['fb_2'],
      rows: [makeRow({ id: 'fb_1' }), makeRow({ id: 'fb_2', adminApprovedAt: '2026-05-25T15:50:00.000Z' })],
    })
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(makePlanArtifact()),
      stderr: '',
      output: ['', JSON.stringify(makePlanArtifact()), ''],
      pid: 123,
      signal: null,
    } as never)

    const result = await runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })

    expect(result.dryRun).toBe(true)
    expect(result.plan.feedbackIds).toEqual(['fb_1', 'fb_2'])
    expect(mockListEligibleFeedbackForDailyRun).toHaveBeenCalledWith({
      featureAreas: ['auth'],
      feedbackTypes: ['performance'],
    })
    expect(mockWriteFileSync).toHaveBeenCalledTimes(2)
    expect(mockMkdirSync).toHaveBeenCalled()
  })

  it('invalid plan artifact exits non-zero with no file writes', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        version: 1,
        generatedAt: '2026-05-25T15:58:00.000Z',
        feedbackIds: [],
        eligibilitySnapshot: { autoEligibleIds: ['fb_1'], approvedIds: [] },
        workstreams: [],
      }),
      stderr: '',
      output: ['', '{}', ''],
      pid: 123,
      signal: null,
    } as never)

    await expect(runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      /invalid daily plan output/i
    )

    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })
})

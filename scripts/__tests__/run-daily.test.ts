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
  markFeedbackAttachedToPr: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { listEligibleFeedbackForDailyRun, markFeedbackAttachedToPr } from '@/features/feedback/server/service'
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
const mockMarkFeedbackAttachedToPr = markFeedbackAttachedToPr as jest.MockedFunction<typeof markFeedbackAttachedToPr>

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
    if (normalized.endsWith('/.claude/feedback-execute.md')) {
      return '# feedback execute skill' as never
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
    expect(result.jsonArtifactPath.replace(/\\/g, '/')).toContain('/docs/bug_enhancement/')
    expect(result.markdownArtifactPath.replace(/\\/g, '/')).toContain('/docs/bug_enhancement/')
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

  it('live run updates feedback rows only after valid execute output', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1', 'fb_2'],
      autoEligibleIds: ['fb_1'],
      approvedIds: ['fb_2'],
      rows: [makeRow({ id: 'fb_1' }), makeRow({ id: 'fb_2', adminApprovedAt: '2026-05-25T15:50:00.000Z' })],
    })
    mockSpawnSync
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify(makePlanArtifact()),
        stderr: '',
        output: ['', JSON.stringify(makePlanArtifact()), ''],
        pid: 123,
        signal: null,
      } as never)
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify({
          status: 'success',
          branchName: 'enhancement/feedback-steward-20260525-1558',
          prNumber: 42,
          prTitle: 'feedback: tighten dashboard copy',
          prBody: '## Summary',
          previewUrl: 'https://sheathacademy-pr-42.onrender.com',
          testsRun: ['npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx'],
          feedbackUpdates: {
            fb_1: {
              uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated button copy',
              changelogLabel: 'Dashboard copy polish',
              changelogUserCredit: 'user@example.com',
            },
            fb_2: {
              uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated helper text',
              changelogLabel: 'Dashboard helper polish',
              changelogUserCredit: 'user@example.com',
            },
          },
        }),
        stderr: '',
        output: ['', '{}', ''],
        pid: 124,
        signal: null,
      } as never)

    const result = await runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })

    expect(result.dryRun).toBe(false)
    expect(result.execution?.prNumber).toBe(42)
    expect(mockMarkFeedbackAttachedToPr).toHaveBeenNthCalledWith(1, 'fb_1', {
      prNumber: 42,
      previewUrl: 'https://sheathacademy-pr-42.onrender.com',
      uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated button copy',
      changelogLabel: 'Dashboard copy polish',
      changelogUserCredit: 'user@example.com',
    })
    expect(mockMarkFeedbackAttachedToPr).toHaveBeenNthCalledWith(2, 'fb_2', {
      prNumber: 42,
      previewUrl: 'https://sheathacademy-pr-42.onrender.com',
      uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated helper text',
      changelogLabel: 'Dashboard helper polish',
      changelogUserCredit: 'user@example.com',
    })
  })

  it('throws without calling Claude when no eligible feedback is found', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: [],
      autoEligibleIds: [],
      approvedIds: [],
      rows: [],
    })

    await expect(runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      /no eligible feedback/i
    )

    expect(mockSpawnSync).not.toHaveBeenCalled()
    expect(mockWriteFileSync).not.toHaveBeenCalled()
    expect(mockMarkFeedbackAttachedToPr).not.toHaveBeenCalled()
  })

  it('planning failure throws without writing artifacts or touching DB', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    mockSpawnSync.mockReturnValueOnce({
      status: 1,
      stdout: '',
      stderr: 'claude: plan generation failed',
      output: ['', '', 'claude: plan generation failed'],
      pid: 123,
      signal: null,
    } as never)

    await expect(runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      /plan generation failed/i
    )

    expect(mockWriteFileSync).not.toHaveBeenCalled()
    expect(mockMarkFeedbackAttachedToPr).not.toHaveBeenCalled()
  })

  it('execute Claude exits non-zero - throws without touching DB', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    const singlePlan = {
      ...makePlanArtifact(),
      feedbackIds: ['fb_1'],
      eligibilitySnapshot: { autoEligibleIds: ['fb_1'], approvedIds: [] },
      workstreams: [
        {
          ...makePlanArtifact().workstreams[0],
          uatByFeedbackId: {
            fb_1: ['Open Render preview', 'Visit dashboard', 'Verify updated button copy'],
          },
        },
      ],
    }
    mockSpawnSync
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify(singlePlan),
        stderr: '',
        output: ['', JSON.stringify(singlePlan), ''],
        pid: 123,
        signal: null,
      } as never)
      .mockReturnValueOnce({
        status: 1,
        stdout: '',
        stderr: 'claude: execute agent failed',
        output: ['', '', 'claude: execute agent failed'],
        pid: 124,
        signal: null,
      } as never)

    await expect(runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      /execute agent failed/i
    )

    expect(mockMarkFeedbackAttachedToPr).not.toHaveBeenCalled()
  })

  it('execute failure leaves feedback rows untouched', async () => {
    const singleFeedbackPlan = {
      ...makePlanArtifact(),
      feedbackIds: ['fb_1'],
      eligibilitySnapshot: { autoEligibleIds: ['fb_1'], approvedIds: [] },
      workstreams: [
        {
          ...makePlanArtifact().workstreams[0],
          uatByFeedbackId: {
            fb_1: ['Open Render preview', 'Visit dashboard', 'Verify updated button copy'],
          },
        },
      ],
    }

    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    mockSpawnSync
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify(singleFeedbackPlan),
        stderr: '',
        output: ['', JSON.stringify(singleFeedbackPlan), ''],
        pid: 125,
        signal: null,
      } as never)
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify({
          status: 'success',
          branchName: 'enhancement/feedback-steward-20260525-1558',
          prNumber: 42,
        }),
        stderr: '',
        output: ['', '{}', ''],
        pid: 126,
        signal: null,
      } as never)

    await expect(runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      /invalid execute output/i
    )

    expect(mockMarkFeedbackAttachedToPr).not.toHaveBeenCalled()
  })
})

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

jest.mock('@/features/about/server/repository', () => ({
  insertChangelogEntry: jest.fn(),
}))

jest.mock('../run-classify', () => ({
  classifyFeedback: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { insertChangelogEntry } from '@/features/about/server/repository'
import { listEligibleFeedbackForDailyRun, markFeedbackAttachedToPr } from '@/features/feedback/server/service'
import { parseDailyCliArgs, parseDailyPlanOutput, runDaily } from '../run-daily'
import type { FeedbackRow } from '@/features/feedback/types'
import { classifyFeedback } from '../run-classify'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>
const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>
const mockMkdirSync = mkdirSync as jest.MockedFunction<typeof mkdirSync>
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>
const mockWriteFileSync = writeFileSync as jest.MockedFunction<typeof writeFileSync>
const mockListEligibleFeedbackForDailyRun = listEligibleFeedbackForDailyRun as jest.MockedFunction<
  typeof listEligibleFeedbackForDailyRun
>
const mockMarkFeedbackAttachedToPr = markFeedbackAttachedToPr as jest.MockedFunction<typeof markFeedbackAttachedToPr>
const mockClassifyFeedback = classifyFeedback as jest.MockedFunction<typeof classifyFeedback>
const mockInsertChangelogEntry = insertChangelogEntry as jest.MockedFunction<typeof insertChangelogEntry>

function makeRow(overrides: Partial<FeedbackRow> = {}): FeedbackRow {
  return {
    id: 'fb_1',
    userId: 'user_1',
    householdId: 'hh_1',
    householdName: null,
    userEmail: 'user@example.com',
    pagePath: '/dashboard',
    sentiment: 'good',
    message: 'Clarify the dashboard button copy',
    createdAt: '2026-05-25T11:40:00.000Z',
    status: 'reviewed',
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
        owningComponent: 'features/dashboard/front/components/DashboardPage.tsx',
        allowedFiles: ['features/dashboard/**', 'features/feedback/**'],
        testPlan: [
          'NEW TEST: features/dashboard/__tests__/integration/Dashboard.test.tsx — button copy matches updated label',
          'RUN: npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx',
        ],
        blastRadiusNotes: '',
        clarifyingQuestions: [],
        uatByFeedbackId: {
          fb_1: ['Open Render preview', 'Visit dashboard', 'Verify updated button copy'],
          fb_2: ['Open Render preview', 'Visit dashboard', 'Verify updated helper text'],
        },
      },
    ],
  }
}

function makeSingleFeedbackPlan(feedbackId: string) {
  return {
    version: 1 as const,
    generatedAt: '2026-05-25T15:58:00.000Z',
    feedbackIds: [feedbackId],
    eligibilitySnapshot: {
      autoEligibleIds: [feedbackId],
      approvedIds: [],
    },
    workstreams: [
      {
        featureArea: 'dashboard',
        summary: 'Address single feedback item',
        owningComponent: 'features/dashboard/front/components/DashboardPage.tsx',
        allowedFiles: ['features/dashboard/**'],
        testPlan: [
          'NEW TEST: features/dashboard/__tests__/integration/Dashboard.test.tsx — fix is visible',
          'RUN: npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx',
        ],
        blastRadiusNotes: '',
        clarifyingQuestions: [],
        uatByFeedbackId: {
          [feedbackId]: ['Open Render preview', 'Verify fix'],
        },
      },
    ],
  }
}

function makeExecuteOutput() {
  return {
    status: 'success',
    branchName: 'enhancement/feedback-steward-20260525-1558',
    prNumber: 42,
    prTitle: 'feedback: tighten dashboard copy',
    prBody: '## Summary\n\n## Changelog Candidate\nDashboard copy polish',
    previewUrl: 'https://sheathacademy-pr-42.onrender.com',
    testsRun: ['npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx'],
    changelogCandidate: {
      label: 'Dashboard copy polish',
      detail: 'Clarified dashboard button labels and helper text based on community feedback.',
      userCredit: 'user@example.com',
    },
    feedbackUpdates: {
      fb_1: {
        uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated button copy',
      },
      fb_2: {
        uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated helper text',
      },
    },
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockClassifyFeedback.mockResolvedValue({ classified: 0, duplicates: 0, failed: 0 })
  mockInsertChangelogEntry.mockResolvedValue(undefined)
  mockExistsSync.mockReturnValue(true)
  mockReadFileSync.mockImplementation((path: any) => {
    const normalized = String(path).replace(/\\/g, '/')
    if (normalized.endsWith('/.claude/skills/feedback-daily-plan/SKILL.md')) {
      return '# daily plan skill' as never
    }
    if (normalized.endsWith('/.claude/skills/feedback-execute/SKILL.md')) {
      return '# feedback execute skill' as never
    }
    if (normalized.endsWith('/scripts/feedback-steward/do-not-automate.json')) {
      return JSON.stringify({ featureAreas: ['auth'], feedbackTypes: ['performance'] }) as never
    }
    if (normalized.endsWith('/package.json')) {
      return JSON.stringify({ version: '2.8.3' }) as never
    }
    throw new Error(`Unexpected readFileSync path: ${normalized}`)
  })
})

describe('parseDailyPlanOutput', () => {
  it('parses direct JSON plan output', () => {
    expect(parseDailyPlanOutput(JSON.stringify(makePlanArtifact()))).toEqual(makePlanArtifact())
  })

  it('parses structured_output plan envelopes from Claude', () => {
    expect(
      parseDailyPlanOutput(
        JSON.stringify({
          type: 'result',
          structured_output: makePlanArtifact(),
        }),
      ),
    ).toEqual(makePlanArtifact())
  })

  it('returns null for invalid plan output', () => {
    expect(parseDailyPlanOutput(JSON.stringify({ version: 1, feedbackIds: [] }))).toBeNull()
  })

  it('returns null when owningComponent is missing', () => {
    const plan = makePlanArtifact()
    const { owningComponent: _omit, ...workstreamWithout } = plan.workstreams[0]
    const invalid = { ...plan, workstreams: [workstreamWithout] }
    expect(parseDailyPlanOutput(JSON.stringify(invalid))).toBeNull()
  })

  it('returns null when owningComponent is empty string', () => {
    const plan = makePlanArtifact()
    const invalid = {
      ...plan,
      workstreams: [{ ...plan.workstreams[0], owningComponent: '' }],
    }
    expect(parseDailyPlanOutput(JSON.stringify(invalid))).toBeNull()
  })

  it('returns null when blastRadiusNotes is missing', () => {
    const plan = makePlanArtifact()
    const { blastRadiusNotes: _omit, ...workstreamWithout } = plan.workstreams[0]
    const invalid = { ...plan, workstreams: [workstreamWithout] }
    expect(parseDailyPlanOutput(JSON.stringify(invalid))).toBeNull()
  })

  it('accepts empty string blastRadiusNotes', () => {
    const plan = makePlanArtifact()
    expect(parseDailyPlanOutput(JSON.stringify(plan))).not.toBeNull()
  })

  it('accepts non-empty blastRadiusNotes', () => {
    const plan = makePlanArtifact()
    const withNotes = {
      ...plan,
      workstreams: [{ ...plan.workstreams[0], blastRadiusNotes: 'Renames classified enum — ripples through service and steward scripts' }],
    }
    const result = parseDailyPlanOutput(JSON.stringify(withNotes))
    expect(result).not.toBeNull()
    expect(result!.workstreams[0].blastRadiusNotes).toBe('Renames classified enum — ripples through service and steward scripts')
  })
})

describe('parseDailyCliArgs', () => {
  it('treats --plan-only as a dry-run alias', () => {
    expect(parseDailyCliArgs(['--plan-only'])).toEqual({
      dryRun: true,
    })
  })

  it('keeps --dry-run behavior unchanged', () => {
    expect(parseDailyCliArgs(['--dry-run'])).toEqual({
      dryRun: true,
    })
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
    expect(mockListEligibleFeedbackForDailyRun).toHaveBeenCalledWith(
      { featureAreas: ['auth'], feedbackTypes: ['performance'] },
      undefined,
    )
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

  it('live run updates feedback rows only after valid execute output — no changelog fields per row', async () => {
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
        stdout: JSON.stringify(makeExecuteOutput()),
        stderr: '',
        output: ['', JSON.stringify(makeExecuteOutput()), ''],
        pid: 124,
        signal: null,
      } as never)

    const result = await runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })

    expect(result.dryRun).toBe(false)
    expect(result.execution?.prNumber).toBe(42)

    // Per-row calls must not include changelog fields — those are PR scope
    expect(mockMarkFeedbackAttachedToPr).toHaveBeenNthCalledWith(1, 'fb_1', {
      prNumber: 42,
      previewUrl: 'https://sheathacademy-pr-42.onrender.com',
      uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated button copy',
    })
    expect(mockMarkFeedbackAttachedToPr).toHaveBeenNthCalledWith(2, 'fb_2', {
      prNumber: 42,
      previewUrl: 'https://sheathacademy-pr-42.onrender.com',
      uatInstructions: 'Open Render preview\nVisit dashboard\nVerify updated helper text',
    })
  })

  it('accepts execute output wrapped in structured_output', async () => {
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
            fb_1: ['Open Render preview', 'Visit dashboard'],
          },
        },
      ],
    }
    const singleExecute = {
      ...makeExecuteOutput(),
      feedbackUpdates: {
        fb_1: { uatInstructions: 'Open Render preview\nVerify' },
      },
    }
    mockSpawnSync
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify({
          type: 'result',
          structured_output: singlePlan,
        }),
        stderr: '',
        output: ['', JSON.stringify({ type: 'result', structured_output: singlePlan }), ''],
        pid: 123,
        signal: null,
      } as never)
      .mockReturnValueOnce({
        status: 0,
        stdout: JSON.stringify({
          type: 'result',
          structured_output: singleExecute,
        }),
        stderr: '',
        output: ['', JSON.stringify({ type: 'result', structured_output: singleExecute }), ''],
        pid: 124,
        signal: null,
      } as never)

    const result = await runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })

    expect(result.execution?.prNumber).toBe(42)
    expect(mockMarkFeedbackAttachedToPr).toHaveBeenCalledWith('fb_1', {
      prNumber: 42,
      previewUrl: 'https://sheathacademy-pr-42.onrender.com',
      uatInstructions: 'Open Render preview\nVerify',
    })
  })

  it('live run inserts a pending changelog entry when execute output includes one', async () => {
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
            fb_1: ['Open Render preview', 'Visit dashboard'],
          },
        },
      ],
    }
    const singleExecute = {
      ...makeExecuteOutput(),
      feedbackUpdates: {
        fb_1: { uatInstructions: 'Open Render preview\nVerify' },
      },
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
        status: 0,
        stdout: JSON.stringify(singleExecute),
        stderr: '',
        output: ['', JSON.stringify(singleExecute), ''],
        pid: 124,
        signal: null,
      } as never)

    await runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })

    expect(mockInsertChangelogEntry).toHaveBeenCalledWith({
      id: expect.any(String),
      version: '2.8.3',
      label: 'Dashboard copy polish',
      detail: 'Clarified dashboard button labels and helper text based on community feedback.',
      source: 'steward',
      prNumber: 42,
      userCredit: 'user@example.com',
      status: 'pending',
    })

    const changelogArtifactCall = (mockWriteFileSync as jest.Mock).mock.calls.find(
      (args) => String(args[0]).replace(/\\/g, '/').includes('tmp/feedback-steward/')
    )
    expect(changelogArtifactCall).toBeUndefined()
  })

  it('execute output with null changelogCandidate is valid', async () => {
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
            fb_1: ['Open Render preview', 'Visit dashboard'],
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
        status: 0,
        stdout: JSON.stringify({
          status: 'success',
          branchName: 'enhancement/feedback-steward-20260525-1558',
          prNumber: 42,
          prTitle: 'feedback: test',
          prBody: '## Summary',
          previewUrl: null,
          testsRun: ['npm test'],
          changelogCandidate: null,
          feedbackUpdates: {
            fb_1: { uatInstructions: 'Open preview and check' },
          },
        }),
        stderr: '',
        output: ['', '{}', ''],
        pid: 124,
        signal: null,
      } as never)

    const result = await runDaily({ dryRun: false, now: new Date('2026-05-25T15:58:00.000Z') })
    expect(result.execution?.prNumber).toBe(42)
    expect(result.execution?.changelogCandidate).toBeNull()
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

  it('surfaces the raw Claude session-limit message during daily planning', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    mockSpawnSync.mockReturnValueOnce({
      status: 1,
      stdout: '',
      stderr: "You've hit your session limit · resets 9:40pm (America/New_York)",
      output: ['', '', "You've hit your session limit · resets 9:40pm (America/New_York)"],
      pid: 123,
      signal: null,
    } as never)

    await expect(runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      /you've hit your session limit/i,
    )

    expect(mockWriteFileSync).not.toHaveBeenCalled()
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

  it('invokes classifyFeedback before checking eligibility', async () => {
    const callOrder: string[] = []
    mockClassifyFeedback.mockImplementation(async () => {
      callOrder.push('classify')
      return { classified: 1, duplicates: 0, failed: 0 }
    })
    mockListEligibleFeedbackForDailyRun.mockImplementation(async () => {
      callOrder.push('eligibility')
      return {
        feedbackIds: ['fb_1', 'fb_2'],
        autoEligibleIds: ['fb_1'],
        approvedIds: ['fb_2'],
        rows: [makeRow({ id: 'fb_1' }), makeRow({ id: 'fb_2', adminApprovedAt: '2026-05-25T15:50:00.000Z' })],
      }
    })
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(makePlanArtifact()),
      stderr: '',
      output: ['', JSON.stringify(makePlanArtifact()), ''],
      pid: 123,
      signal: null,
    } as never)

    await runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })

    expect(callOrder).toEqual(['classify', 'eligibility'])
  })

  it('includes newly classified rows in the same daily run', async () => {
    mockClassifyFeedback.mockResolvedValue({ classified: 1, duplicates: 0, failed: 0 })
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    const plan = makeSingleFeedbackPlan('fb_1')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(plan),
      stderr: '',
      output: ['', JSON.stringify(plan), ''],
      pid: 123,
      signal: null,
    } as never)

    const result = await runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })

    expect(result.plan.feedbackIds).toContain('fb_1')
    expect(mockClassifyFeedback).toHaveBeenCalledTimes(1)
    expect(mockListEligibleFeedbackForDailyRun).toHaveBeenCalledTimes(1)
  })

  it('no plan runs when all newly classified rows require approval', async () => {
    mockClassifyFeedback.mockResolvedValue({ classified: 0, duplicates: 0, failed: 0 })
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: [],
      autoEligibleIds: [],
      approvedIds: [],
      rows: [],
    })

    await expect(runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      /no eligible feedback/i,
    )

    expect(mockSpawnSync).not.toHaveBeenCalled()
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('exits safely when classifyFeedback throws without calling Claude or writing files', async () => {
    mockClassifyFeedback.mockRejectedValue(new Error('DB connection failed'))

    await expect(runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })).rejects.toThrow(
      'DB connection failed',
    )

    expect(mockListEligibleFeedbackForDailyRun).not.toHaveBeenCalled()
    expect(mockSpawnSync).not.toHaveBeenCalled()
    expect(mockWriteFileSync).not.toHaveBeenCalled()
  })

  it('plan generation uses plain "claude" command on Windows (not claude.cmd)', async () => {
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })

    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    const plan = makeSingleFeedbackPlan('fb_1')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(plan),
      stderr: '',
      output: ['', JSON.stringify(plan), ''],
      pid: 123,
      signal: null,
    } as never)

    await runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })

    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })

    const [command] = mockSpawnSync.mock.calls[0]
    expect(command).toBe('claude')
  })

  it('daily planning passes no timeout to Claude — plan runs until completion', async () => {
    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    const plan = makeSingleFeedbackPlan('fb_1')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(plan),
      stderr: '',
      output: ['', JSON.stringify(plan), ''],
      pid: 123,
      signal: null,
    } as never)

    await runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })

    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.timeout).toBeUndefined()
  })

  it('plan generation does not pass shell: true on Windows', async () => {
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'win32', configurable: true })

    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    const plan = makeSingleFeedbackPlan('fb_1')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(plan),
      stderr: '',
      output: ['', JSON.stringify(plan), ''],
      pid: 123,
      signal: null,
    } as never)

    await runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })

    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })

    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.shell).toBeFalsy()
  })

  it('plan generation does not pass shell: true on Linux', async () => {
    const originalPlatform = process.platform
    Object.defineProperty(process, 'platform', { value: 'linux', configurable: true })

    mockListEligibleFeedbackForDailyRun.mockResolvedValue({
      feedbackIds: ['fb_1'],
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
      rows: [makeRow({ id: 'fb_1' })],
    })
    const plan = makeSingleFeedbackPlan('fb_1')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(plan),
      stderr: '',
      output: ['', JSON.stringify(plan), ''],
      pid: 123,
      signal: null,
    } as never)

    await runDaily({ dryRun: true, now: new Date('2026-05-25T15:58:00.000Z') })

    Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })

    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.shell).toBeFalsy()
  })

  it('dry-run still classifies submitted feedback before generating the plan', async () => {
    mockClassifyFeedback.mockResolvedValue({ classified: 1, duplicates: 0, failed: 0 })
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
    expect(mockClassifyFeedback).toHaveBeenCalledTimes(1)
    expect(mockMarkFeedbackAttachedToPr).not.toHaveBeenCalled()
  })
})

/** @jest-environment node */

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}))

jest.mock('../run-daily', () => {
  const actual = jest.requireActual('../run-daily')
  return {
    ...actual,
    executeSavedDailyPlan: jest.fn(),
  }
})

import { existsSync, readFileSync } from 'fs'
import { executeSavedDailyPlan } from '../run-daily'
import { runExecuteDaily } from '../run-execute'

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>
const mockExecuteSavedDailyPlan = executeSavedDailyPlan as jest.MockedFunction<typeof executeSavedDailyPlan>

function makePlanArtifact() {
  return {
    version: 1,
    generatedAt: '2026-05-25T15:58:00.000Z',
    feedbackIds: ['fb_1'],
    eligibilitySnapshot: {
      autoEligibleIds: ['fb_1'],
      approvedIds: [],
    },
    workstreams: [
      {
        featureArea: 'dashboard',
        summary: 'Address dashboard copy issue',
        owningComponent: 'features/dashboard/front/components/DashboardPage.tsx',
        allowedFiles: ['features/dashboard/**'],
        testPlan: ['npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx'],
        blastRadiusNotes: '',
        clarifyingQuestions: [],
        uatByFeedbackId: {
          fb_1: ['Open Render preview', 'Verify copy update'],
        },
      },
    ],
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockExistsSync.mockReturnValue(true)
  mockExecuteSavedDailyPlan.mockResolvedValue({
    status: 'success',
    branchName: 'enhancement/feedback-steward-20260525-1558',
    prNumber: 42,
    prTitle: 'feedback: tighten dashboard copy',
    prBody: '## Summary',
    previewUrl: 'https://sheathacademy-pr-42.onrender.com',
    testsRun: ['npm test -- --runInBand features/dashboard/__tests__/integration/Dashboard.test.tsx'],
    changelogCandidate: null,
    feedbackUpdates: {
      fb_1: {
        uatInstructions: 'Open Render preview\nVerify copy update',
      },
    },
  })
})

describe('runExecuteDaily', () => {
  it('reads a saved plan artifact and executes that exact plan', async () => {
    mockReadFileSync.mockImplementation((path: any) => {
      const normalized = String(path).replace(/\\/g, '/')
      if (normalized.endsWith('/docs/bug_enhancement/20260525-1558-steward-grouped-plan.json')) {
        return JSON.stringify(makePlanArtifact()) as never
      }
      throw new Error(`Unexpected readFileSync path: ${normalized}`)
    })

    const result = await runExecuteDaily({
      artifactPath: 'c:\\PROJECTS\\sheath-academy\\docs\\bug_enhancement\\20260525-1558-steward-grouped-plan.json',
    })

    expect(mockExecuteSavedDailyPlan).toHaveBeenCalledWith({
      plan: makePlanArtifact(),
      jsonArtifactPath: 'c:\\PROJECTS\\sheath-academy\\docs\\bug_enhancement\\20260525-1558-steward-grouped-plan.json',
      markdownArtifactPath: 'c:\\PROJECTS\\sheath-academy\\docs\\bug_enhancement\\20260525-1558-steward-grouped-plan.md',
    })
    expect(result.execution.prNumber).toBe(42)
  })

  it('throws when the artifact path does not exist', async () => {
    mockExistsSync.mockReturnValue(false)

    await expect(runExecuteDaily({
      artifactPath: 'c:\\PROJECTS\\sheath-academy\\docs\\bug_enhancement\\missing-plan.json',
    })).rejects.toThrow(/artifact not found/i)

    expect(mockExecuteSavedDailyPlan).not.toHaveBeenCalled()
  })

  it('throws when the artifact JSON does not match the daily plan schema', async () => {
    mockReadFileSync.mockReturnValue(JSON.stringify({ version: 1, feedbackIds: [] }) as never)

    await expect(runExecuteDaily({
      artifactPath: 'c:\\PROJECTS\\sheath-academy\\docs\\bug_enhancement\\bad-plan.json',
    })).rejects.toThrow(/invalid daily plan artifact/i)

    expect(mockExecuteSavedDailyPlan).not.toHaveBeenCalled()
  })
})

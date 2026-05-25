/** @jest-environment node */

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}))

jest.mock('fs', () => ({
  readFileSync: jest.fn(),
}))

jest.mock('../feedback-requeue', () => ({
  getUnclassifiedFeedback: jest.fn(),
}))

jest.mock('../feedback-dedupe', () => ({
  detectDuplicate: jest.fn(),
}))

jest.mock('@/features/feedback/server/repository', () => ({
  updateFeedbackTriage: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { readFileSync } from 'fs'
import { getUnclassifiedFeedback } from '../feedback-requeue'
import { detectDuplicate } from '../feedback-dedupe'
import { updateFeedbackTriage } from '@/features/feedback/server/repository'
import { classifyFeedback, parseClassifyOutput, runClassifySkill } from '../run-classify'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>
const mockGetUnclassifiedFeedback = getUnclassifiedFeedback as jest.MockedFunction<typeof getUnclassifiedFeedback>
const mockDetectDuplicate = detectDuplicate as jest.MockedFunction<typeof detectDuplicate>
const mockUpdateFeedbackTriage = updateFeedbackTriage as jest.MockedFunction<typeof updateFeedbackTriage>

function makeItem(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'fb_1',
    message: 'Dashboard button is confusing',
    pagePath: '/dashboard',
    sentiment: 'poor',
    createdAt: '2026-05-25T10:00:00.000Z',
    userId: 'user_1',
    userEmail: 'test@example.com',
    ...overrides,
  }
}

function makeClassifyOutput(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    status: 'classified',
    featureArea: 'dashboard',
    feedbackType: 'ux',
    riskLevel: 'low',
    confidence: 'high',
    recommendation: 'Clarify the dashboard button label and styling.',
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  mockReadFileSync.mockReturnValue('# feedback classify skill' as never)
})

describe('parseClassifyOutput', () => {
  it('parses direct structured JSON output', () => {
    const output = parseClassifyOutput(JSON.stringify(makeClassifyOutput()))

    expect(output).toEqual(makeClassifyOutput())
  })

  it('parses structured JSON nested in a text envelope', () => {
    const output = parseClassifyOutput(
      JSON.stringify({
        text: JSON.stringify(makeClassifyOutput()),
      })
    )

    expect(output).toEqual(makeClassifyOutput())
  })

  it('returns null for malformed structured output', () => {
    const output = parseClassifyOutput(
      JSON.stringify({
        status: 'classified',
        featureArea: 'dashboard',
      })
    )

    expect(output).toBeNull()
  })
})

describe('runClassifySkill', () => {
  it('invokes Claude with a JSON schema contract and closed stdin', () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(makeClassifyOutput()),
      stderr: '',
      output: ['', JSON.stringify(makeClassifyOutput()), ''],
      pid: 123,
      signal: null,
    } as never)

    const output = runClassifySkill(makeItem())

    expect(output).toEqual(makeClassifyOutput())
    expect(mockSpawnSync).toHaveBeenCalledWith(
      expect.stringMatching(/^claude(\.cmd)?$/),
      expect.arrayContaining(['-p', '--output-format', 'json', '--json-schema']),
      expect.objectContaining({
        encoding: 'utf8',
        input: '',
        timeout: 60_000,
      })
    )
  })
})

describe('classifyFeedback', () => {
  it('cancels duplicates before calling Claude', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicate.mockResolvedValue({
      isDuplicate: true,
      duplicateOfId: 'fb_existing',
      reason: 'message_similarity',
    })

    const summary = await classifyFeedback()

    expect(summary).toEqual({ classified: 0, duplicates: 1, failed: 0 })
    expect(mockSpawnSync).not.toHaveBeenCalled()
    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', {
      status: 'cancelled',
      duplicateOfFeedbackId: 'fb_existing',
    })
  })

  it('fails malformed classify output instead of writing incomplete triage', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicate.mockResolvedValue({
      isDuplicate: false,
      duplicateOfId: null,
      reason: null,
    })
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ status: 'classified' }),
      stderr: '',
      output: ['', JSON.stringify({ status: 'classified' }), ''],
      pid: 123,
      signal: null,
    } as never)

    const summary = await classifyFeedback()

    expect(summary).toEqual({ classified: 0, duplicates: 0, failed: 1 })
    expect(mockUpdateFeedbackTriage).not.toHaveBeenCalled()
  })

  it('writes triage only after valid classify output is returned', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicate.mockResolvedValue({
      isDuplicate: false,
      duplicateOfId: null,
      reason: null,
    })
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({
        text: JSON.stringify(makeClassifyOutput()),
      }),
      stderr: '',
      output: ['', JSON.stringify({ text: JSON.stringify(makeClassifyOutput()) }), ''],
      pid: 123,
      signal: null,
    } as never)

    const summary = await classifyFeedback()

    expect(summary).toEqual({ classified: 1, duplicates: 0, failed: 0 })
    expect(mockUpdateFeedbackTriage).toHaveBeenCalledWith('fb_1', {
      status: 'classified',
      featureArea: 'dashboard',
      feedbackType: 'ux',
      riskLevel: 'low',
      confidence: 'high',
    })
  })
})

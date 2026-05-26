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

jest.mock('../claude-preflight', () => ({
  runClaudePreflight: jest.fn(),
}))

jest.mock('@/features/feedback/server/service', () => ({
  applyClassification: jest.fn(),
  markFeedbackDuplicate: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { readFileSync } from 'fs'
import { getUnclassifiedFeedback } from '../feedback-requeue'
import { detectDuplicate } from '../feedback-dedupe'
import { runClaudePreflight } from '../claude-preflight'
import { applyClassification, markFeedbackDuplicate } from '@/features/feedback/server/service'
import { classifyFeedback, parseClassifyOutput, runClassifySkill } from '../run-classify'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>
const mockGetUnclassifiedFeedback = getUnclassifiedFeedback as jest.MockedFunction<typeof getUnclassifiedFeedback>
const mockDetectDuplicate = detectDuplicate as jest.MockedFunction<typeof detectDuplicate>
const mockRunClaudePreflight = runClaudePreflight as jest.MockedFunction<typeof runClaudePreflight>
const mockApplyClassification = applyClassification as jest.MockedFunction<typeof applyClassification>
const mockMarkFeedbackDuplicate = markFeedbackDuplicate as jest.MockedFunction<typeof markFeedbackDuplicate>

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
  mockRunClaudePreflight.mockReturnValue({
    status: 'ok',
    checkedAt: '2026-05-25T20:00:00.000Z',
    elapsedMs: 1200,
    timeoutMs: 30_000,
  })
})

describe('parseClassifyOutput', () => {
  it('parses direct structured JSON output', () => {
    const output = parseClassifyOutput(JSON.stringify(makeClassifyOutput()))

    expect(output).toEqual(makeClassifyOutput())
  })

  it('parses structured_output envelopes from Claude', () => {
    const output = parseClassifyOutput(
      JSON.stringify({
        type: 'result',
        structured_output: makeClassifyOutput(),
      }),
    )

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

const originalPlatform = process.platform

function setPlatform(platform: string) {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true })
}

afterAll(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })
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
        timeout: 180_000,
      })
    )
  })
})

describe('runClassifySkill — Windows compatibility', () => {
  afterEach(() => {
    setPlatform('linux')
  })

  it('uses plain "claude" command on Windows (not claude.cmd)', () => {
    setPlatform('win32')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(makeClassifyOutput()),
      stderr: '',
      output: ['', JSON.stringify(makeClassifyOutput()), ''],
      pid: 123,
      signal: null,
    } as never)

    runClassifySkill(makeItem())

    const [command] = mockSpawnSync.mock.calls[0]
    expect(command).toBe('claude')
  })

  it('does not pass shell: true on Windows', () => {
    setPlatform('win32')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(makeClassifyOutput()),
      stderr: '',
      output: ['', JSON.stringify(makeClassifyOutput()), ''],
      pid: 123,
      signal: null,
    } as never)

    runClassifySkill(makeItem())

    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.shell).toBeFalsy()
  })

  it('does not pass shell: true on Linux', () => {
    setPlatform('linux')
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(makeClassifyOutput()),
      stderr: '',
      output: ['', JSON.stringify(makeClassifyOutput()), ''],
      pid: 123,
      signal: null,
    } as never)

    runClassifySkill(makeItem())

    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.shell).toBeFalsy()
  })
})

describe('classifyFeedback', () => {
  it('runs Claude preflight before processing feedback items', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicate.mockResolvedValue({
      isDuplicate: true,
      duplicateOfId: 'fb_existing',
      reason: 'message_similarity',
    })

    await classifyFeedback()

    expect(mockRunClaudePreflight).toHaveBeenCalledTimes(1)
    expect(mockDetectDuplicate).toHaveBeenCalledTimes(1)
  })

  it('aborts before processing rows when Claude preflight fails', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockRunClaudePreflight.mockImplementation(() => {
      throw new Error('Claude unavailable for preflight: You\'ve hit your session limit · resets 9:40pm (America/New_York)')
    })

    await expect(classifyFeedback()).rejects.toThrow(/you've hit your session limit/i)

    expect(mockDetectDuplicate).not.toHaveBeenCalled()
    expect(mockApplyClassification).not.toHaveBeenCalled()
  })

  it('aborts the full run when Claude becomes unavailable mid-classification', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicate.mockResolvedValue({
      isDuplicate: false,
      duplicateOfId: null,
      reason: null,
    })
    mockSpawnSync.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: "You've hit your session limit · resets 9:40pm (America/New_York)",
      output: ['', '', "You've hit your session limit · resets 9:40pm (America/New_York)"],
      pid: 123,
      signal: null,
    } as never)

    await expect(classifyFeedback()).rejects.toThrow(/you've hit your session limit/i)

    expect(mockApplyClassification).not.toHaveBeenCalled()
  })

  it('writes per-item progress with item position and completion timing', async () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
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

    await classifyFeedback()

    const output = stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('')
    expect(output).toContain('Found 1 unclassified feedback items')
    expect(output).toContain('Claude preflight ok')
    expect(output).toContain('Processing fb_1 (1/1) started at')
    expect(output).toContain('Claude said:')
    expect(output).toContain('status: classified')
    expect(output).toContain('featureArea: dashboard')
    expect(output).toContain('feedbackType: ux')
    expect(output).toContain('riskLevel: low')
    expect(output).toContain('confidence: high')
    expect(output).toContain('recommendation: Clarify the dashboard button label and styling.')
    expect(output).toContain('classified: ux/dashboard confidence=high')
    expect(output).toContain('completed in')

    stderrSpy.mockRestore()
  })

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
    expect(mockMarkFeedbackDuplicate).toHaveBeenCalledWith('fb_1', 'fb_existing')
  })

  it('fails malformed classify output instead of writing incomplete triage', async () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
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
    expect(mockApplyClassification).not.toHaveBeenCalled()
    const output = stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('')
    expect(output).toContain('classify skill produced invalid output for fb_1')
    expect(output).toContain('Claude stdout:')
    expect(output).toContain('{"status":"classified"}')
    expect(output).toContain('Claude stderr: <empty>')
    stderrSpy.mockRestore()
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
    expect(mockApplyClassification).toHaveBeenCalledWith('fb_1', {
      status: 'classified',
      featureArea: 'dashboard',
      feedbackType: 'ux',
      riskLevel: 'low',
      confidence: 'high',
      recommendation: 'Clarify the dashboard button label and styling.',
    })
  })
})

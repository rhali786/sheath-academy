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
  detectDuplicatesBatch: jest.fn(),
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
import { detectDuplicate, detectDuplicatesBatch } from '../feedback-dedupe'
import { runClaudePreflight } from '../claude-preflight'
import { applyClassification, markFeedbackDuplicate } from '@/features/feedback/server/service'
import { classifyFeedback, parseClassifyOutput, parseBatchClassifyOutput, runClassifySkill, runClassifySkillBatch } from '../run-classify'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>
const mockReadFileSync = readFileSync as jest.MockedFunction<typeof readFileSync>
const mockGetUnclassifiedFeedback = getUnclassifiedFeedback as jest.MockedFunction<typeof getUnclassifiedFeedback>
const mockDetectDuplicate = detectDuplicate as jest.MockedFunction<typeof detectDuplicate>
const mockDetectDuplicatesBatch = detectDuplicatesBatch as jest.MockedFunction<typeof detectDuplicatesBatch>
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
    status: 'reviewed',
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
  mockDetectDuplicatesBatch.mockResolvedValue(new Map() as never)
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
        status: 'reviewed',
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
  it('invokes Claude with a JSON schema contract and the prompt passed via stdin', () => {
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
        input: expect.stringContaining('Classify this feedback item'),
        timeout: 45_000,
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

describe('parseBatchClassifyOutput', () => {
  it('parses a valid batch response into a map keyed by id', () => {
    const raw = JSON.stringify({
      items: [{ ...makeClassifyOutput(), id: 'fb_1' }],
    })

    const result = parseBatchClassifyOutput(raw)

    expect(result).not.toBeNull()
    expect(result!.get('fb_1')).toEqual(makeClassifyOutput())
  })

  it('parses a structured_output envelope', () => {
    const raw = JSON.stringify({
      structured_output: { items: [{ ...makeClassifyOutput(), id: 'fb_1' }] },
    })

    expect(parseBatchClassifyOutput(raw)).not.toBeNull()
  })

  it('parses multiple items in one response', () => {
    const raw = JSON.stringify({
      items: [
        { ...makeClassifyOutput(), id: 'fb_1' },
        { ...makeClassifyOutput({ featureArea: 'attendance' }), id: 'fb_2' },
      ],
    })

    const result = parseBatchClassifyOutput(raw)!

    expect(result.get('fb_1')?.featureArea).toBe('dashboard')
    expect(result.get('fb_2')?.featureArea).toBe('attendance')
  })

  it('returns null for empty string', () => {
    expect(parseBatchClassifyOutput('')).toBeNull()
  })

  it('returns null when items array is missing', () => {
    expect(parseBatchClassifyOutput(JSON.stringify({ status: 'ok' }))).toBeNull()
  })

  it('returns null when any item is missing required fields', () => {
    const raw = JSON.stringify({
      items: [{ id: 'fb_1', status: 'reviewed' }],
    })
    expect(parseBatchClassifyOutput(raw)).toBeNull()
  })

  it('returns null when an item is missing its id field', () => {
    const raw = JSON.stringify({
      items: [makeClassifyOutput()],
    })
    expect(parseBatchClassifyOutput(raw)).toBeNull()
  })
})

describe('runClassifySkillBatch', () => {
  it('makes exactly one Claude call for multiple items', () => {
    const batchOutput = {
      items: [
        { ...makeClassifyOutput(), id: 'fb_1' },
        { ...makeClassifyOutput({ featureArea: 'attendance' }), id: 'fb_2' },
      ],
    }
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(batchOutput),
      stderr: '',
      output: ['', JSON.stringify(batchOutput), ''],
      pid: 123,
      signal: null,
    } as never)

    const result = runClassifySkillBatch([makeItem({ id: 'fb_1' }), makeItem({ id: 'fb_2' })])

    expect(mockSpawnSync).toHaveBeenCalledTimes(1)
    expect(result).not.toBeNull()
    expect(result!.get('fb_1')).toEqual(makeClassifyOutput())
    expect(result!.get('fb_2')).toEqual(makeClassifyOutput({ featureArea: 'attendance' }))
  })

  it('passes --json-schema and --append-system-prompt to Claude', () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify({ items: [{ ...makeClassifyOutput(), id: 'fb_1' }] }),
      stderr: '',
      output: ['', '{}', ''],
      pid: 123,
      signal: null,
    } as never)

    runClassifySkillBatch([makeItem()])

    expect(mockSpawnSync).toHaveBeenCalledWith(
      expect.stringMatching(/^claude(\.cmd)?$/),
      expect.arrayContaining(['-p', '--output-format', 'json', '--json-schema', '--append-system-prompt']),
      expect.objectContaining({ encoding: 'utf8', input: expect.stringContaining('Classify these') }),
    )
  })

  it('returns null when Claude output is invalid', () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: '{}',
      stderr: '',
      output: ['', '{}', ''],
      pid: 123,
      signal: null,
    } as never)

    expect(runClassifySkillBatch([makeItem()])).toBeNull()
  })

  it('throws when Claude is unavailable', () => {
    mockSpawnSync.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: "You've hit your session limit · resets 9:40pm (America/New_York)",
      output: ['', '', "You've hit your session limit · resets 9:40pm (America/New_York)"],
      pid: 123,
      signal: null,
    } as never)

    expect(() => runClassifySkillBatch([makeItem()])).toThrow(/you've hit your session limit/i)
  })
})

describe('classifyFeedback', () => {
  it('runs Claude preflight before batch dedupe and classification', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicatesBatch.mockResolvedValue(
      new Map([['fb_1', { isDuplicate: true, duplicateOfId: 'fb_existing', reason: 'message_similarity' }]]) as never
    )

    await classifyFeedback()

    expect(mockRunClaudePreflight).toHaveBeenCalledTimes(1)
    expect(mockDetectDuplicatesBatch).toHaveBeenCalledTimes(1)
  })

  it('aborts before processing rows when Claude preflight fails', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockRunClaudePreflight.mockImplementation(() => {
      throw new Error("Claude unavailable for preflight: You've hit your session limit · resets 9:40pm (America/New_York)")
    })

    await expect(classifyFeedback()).rejects.toThrow(/you've hit your session limit/i)

    expect(mockDetectDuplicatesBatch).not.toHaveBeenCalled()
    expect(mockApplyClassification).not.toHaveBeenCalled()
  })

  it('makes exactly one Claude call for all non-duplicate items', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem({ id: 'fb_1' }), makeItem({ id: 'fb_2' })] as never)
    mockDetectDuplicatesBatch.mockResolvedValue(new Map([
      ['fb_1', { isDuplicate: false, duplicateOfId: null, reason: null }],
      ['fb_2', { isDuplicate: false, duplicateOfId: null, reason: null }],
    ]) as never)
    const batchOutput = {
      items: [
        { ...makeClassifyOutput(), id: 'fb_1' },
        { ...makeClassifyOutput(), id: 'fb_2' },
      ],
    }
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(batchOutput),
      stderr: '',
      output: ['', JSON.stringify(batchOutput), ''],
      pid: 123,
      signal: null,
    } as never)

    const summary = await classifyFeedback()

    expect(mockSpawnSync).toHaveBeenCalledTimes(1)
    expect(summary).toEqual({ classified: 2, duplicates: 0, failed: 0 })
  })

  it('cancels duplicates and skips them from the Claude call', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicatesBatch.mockResolvedValue(
      new Map([['fb_1', { isDuplicate: true, duplicateOfId: 'fb_existing', reason: 'message_similarity' }]]) as never
    )

    const summary = await classifyFeedback()

    expect(summary).toEqual({ classified: 0, duplicates: 1, failed: 0 })
    expect(mockSpawnSync).not.toHaveBeenCalled()
    expect(mockMarkFeedbackDuplicate).toHaveBeenCalledWith('fb_1', 'fb_existing')
  })

  it('counts items as failed when batch output is invalid', async () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicatesBatch.mockResolvedValue(
      new Map([['fb_1', { isDuplicate: false, duplicateOfId: null, reason: null }]]) as never
    )
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: '{}',
      stderr: '',
      output: ['', '{}', ''],
      pid: 123,
      signal: null,
    } as never)

    const summary = await classifyFeedback()

    expect(summary).toEqual({ classified: 0, duplicates: 0, failed: 1 })
    expect(mockApplyClassification).not.toHaveBeenCalled()
    stderrSpy.mockRestore()
  })

  it('applies classification for every item returned in the batch', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicatesBatch.mockResolvedValue(
      new Map([['fb_1', { isDuplicate: false, duplicateOfId: null, reason: null }]]) as never
    )
    const batchOutput = { items: [{ ...makeClassifyOutput(), id: 'fb_1' }] }
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(batchOutput),
      stderr: '',
      output: ['', JSON.stringify(batchOutput), ''],
      pid: 123,
      signal: null,
    } as never)

    const summary = await classifyFeedback()

    expect(summary).toEqual({ classified: 1, duplicates: 0, failed: 0 })
    expect(mockApplyClassification).toHaveBeenCalledWith('fb_1', makeClassifyOutput())
  })

  it('aborts when Claude throws during batch classification', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicatesBatch.mockResolvedValue(
      new Map([['fb_1', { isDuplicate: false, duplicateOfId: null, reason: null }]]) as never
    )
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

  it('prints a summary with emoji after classification completes', async () => {
    const stderrSpy = jest.spyOn(process.stderr, 'write').mockImplementation(() => true)
    mockGetUnclassifiedFeedback.mockResolvedValue([makeItem()] as never)
    mockDetectDuplicatesBatch.mockResolvedValue(
      new Map([['fb_1', { isDuplicate: false, duplicateOfId: null, reason: null }]]) as never
    )
    const batchOutput = { items: [{ ...makeClassifyOutput(), id: 'fb_1' }] }
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: JSON.stringify(batchOutput),
      stderr: '',
      output: ['', JSON.stringify(batchOutput), ''],
      pid: 123,
      signal: null,
    } as never)

    await classifyFeedback()

    const output = stderrSpy.mock.calls.map(([chunk]) => String(chunk)).join('')
    expect(output).toContain('1 classified')
    expect(output).toContain('0 duplicate')
    expect(output).toContain('0 failed')
    stderrSpy.mockRestore()
  })
})

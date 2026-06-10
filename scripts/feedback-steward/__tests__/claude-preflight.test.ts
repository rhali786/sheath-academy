/** @jest-environment node */

jest.mock('../claude-integration', () => ({
  runClaudePrompt: jest.fn(),
}))

import { runClaudePrompt } from '../claude-integration'
import { runClaudePreflight } from '../claude-preflight'

const mockRunClaudePrompt = runClaudePrompt as jest.MockedFunction<typeof runClaudePrompt>

beforeEach(() => {
  jest.clearAllMocks()
  delete process.env.STEWARD_CLAUDE_PREFLIGHT_TIMEOUT_MS
})

describe('runClaudePreflight', () => {
  it('runs a real Claude preflight prompt with a short default timeout', () => {
    mockRunClaudePrompt.mockReturnValue({
      stdout: 'OK',
      stderr: '',
      elapsedMs: 850,
      timeoutMs: 30_000,
    })

    const result = runClaudePreflight()

    expect(result.status).toBe('ok')
    expect(result.timeoutMs).toBe(30_000)
    expect(result.elapsedMs).toBe(850)
    expect(mockRunClaudePrompt).toHaveBeenCalledWith(
      expect.objectContaining({
        stageLabel: 'preflight',
        args: expect.arrayContaining(['-p', 'Reply with exactly OK and nothing else.']),
        timeoutMs: 30_000,
      }),
    )
  })

  it('uses STEWARD_CLAUDE_PREFLIGHT_TIMEOUT_MS when provided', () => {
    process.env.STEWARD_CLAUDE_PREFLIGHT_TIMEOUT_MS = '45000'
    mockRunClaudePrompt.mockReturnValue({
      stdout: 'OK',
      stderr: '',
      elapsedMs: 1000,
      timeoutMs: 45_000,
    })

    const result = runClaudePreflight()

    expect(result.timeoutMs).toBe(45_000)
    expect(mockRunClaudePrompt).toHaveBeenCalledWith(
      expect.objectContaining({ timeoutMs: 45_000 }),
    )
  })

  it('throws when Claude preflight returns unexpected output', () => {
    mockRunClaudePrompt.mockReturnValue({
      stdout: 'not ok',
      stderr: '',
      elapsedMs: 500,
      timeoutMs: 30_000,
    })

    expect(() => runClaudePreflight()).toThrow(/invalid output/i)
  })
})

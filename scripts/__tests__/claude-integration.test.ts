/** @jest-environment node */

jest.mock('../claude-runner', () => ({
  spawnClaude: jest.fn(),
}))

import { spawnClaude } from '../claude-runner'
import { runClaudePrompt } from '../claude-integration'

const mockSpawnClaude = spawnClaude as jest.MockedFunction<typeof spawnClaude>

beforeEach(() => {
  jest.clearAllMocks()
})

describe('runClaudePrompt', () => {
  it('returns stdout and elapsed time on success', () => {
    mockSpawnClaude.mockReturnValue({
      status: 0,
      stdout: '{"status":"ok"}',
      stderr: '',
      output: ['', '{"status":"ok"}', ''],
      pid: 123,
      signal: null,
    } as never)

    const result = runClaudePrompt({
      stageLabel: 'preflight',
      args: ['-p', 'Reply with exactly OK and nothing else.'],
      timeoutMs: 30_000,
    })

    expect(result.stdout).toBe('{"status":"ok"}')
    expect(result.timeoutMs).toBe(30_000)
  })

  it('surfaces the raw session-limit message instead of a generic exit failure', () => {
    mockSpawnClaude.mockReturnValue({
      status: 1,
      stdout: '',
      stderr:
        "Warning: no stdin data received in 3s, proceeding without it.\nYou've hit your session limit · resets 9:40pm (America/New_York)\n",
      output: ['', '', ''],
      pid: 123,
      signal: null,
    } as never)

    expect(() =>
      runClaudePrompt({
        stageLabel: 'classify feedback',
        args: ['-p', 'classify'],
        timeoutMs: 30_000,
      }),
    ).toThrow(/you've hit your session limit/i)
  })

  it('surfaces login/auth problems clearly', () => {
    mockSpawnClaude.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'Not authenticated. Please run claude login.\n',
      output: ['', '', ''],
      pid: 123,
      signal: null,
    } as never)

    expect(() =>
      runClaudePrompt({
        stageLabel: 'daily planning',
        args: ['-p', 'plan'],
        timeoutMs: 60_000,
      }),
    ).toThrow(/please run claude login/i)
  })

  it('uses a timeout message only when no clearer Claude response exists', () => {
    mockSpawnClaude.mockReturnValue({
      error: Object.assign(new Error('spawnSync C:\\WINDOWS\\system32\\cmd.exe ETIMEDOUT'), {
        code: 'ETIMEDOUT',
      }),
      status: null,
      stdout: '',
      stderr: '',
      output: ['', '', ''],
      pid: 123,
      signal: null,
    } as never)

    expect(() =>
      runClaudePrompt({
        stageLabel: 'classify feedback',
        args: ['-p', 'classify'],
        timeoutMs: 180_000,
      }),
    ).toThrow(/timed out after 180s/i)
  })
})

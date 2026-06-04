/** @jest-environment node */

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { spawnClaude } from '../claude-runner'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>

const originalPlatform = process.platform

function setPlatform(platform: string) {
  Object.defineProperty(process, 'platform', { value: platform, configurable: true })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockSpawnSync.mockReturnValue({
    status: 0,
    stdout: '',
    stderr: '',
    output: ['', '', ''],
    pid: 1,
    signal: null,
  } as never)
})

afterAll(() => {
  Object.defineProperty(process, 'platform', { value: originalPlatform, configurable: true })
})

describe('spawnClaude', () => {
  it('uses plain "claude" command on Linux', () => {
    setPlatform('linux')
    spawnClaude(['-p', 'hello'])
    expect(mockSpawnSync).toHaveBeenCalledWith('claude', ['-p', 'hello'], expect.anything())
  })

  it('uses plain "claude" command on macOS', () => {
    setPlatform('darwin')
    spawnClaude(['-p', 'hello'])
    expect(mockSpawnSync).toHaveBeenCalledWith('claude', ['-p', 'hello'], expect.anything())
  })

  it('uses plain "claude" command on Windows (not claude.cmd)', () => {
    setPlatform('win32')
    spawnClaude(['-p', 'hello'])
    expect(mockSpawnSync).toHaveBeenCalledWith('claude', ['-p', 'hello'], expect.anything())
  })

  it('does not pass shell: true on Windows', () => {
    setPlatform('win32')
    spawnClaude(['-p', 'hello'])
    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.shell).toBeFalsy()
  })

  it('does not pass shell: true on Linux', () => {
    setPlatform('linux')
    spawnClaude(['-p', 'hello'])
    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.shell).toBeFalsy()
  })

  it('does not pass shell: true on macOS', () => {
    setPlatform('darwin')
    spawnClaude(['-p', 'hello'])
    const [, , opts] = mockSpawnSync.mock.calls[0] as [string, string[], Record<string, unknown>]
    expect(opts.shell).toBeFalsy()
  })

  it('passes through caller options on Linux', () => {
    setPlatform('linux')
    spawnClaude(['-p', 'hello'], { encoding: 'utf8', timeout: 60_000, input: '' })
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'claude',
      ['-p', 'hello'],
      expect.objectContaining({ encoding: 'utf8', timeout: 60_000, input: '' })
    )
  })

  it('passes through caller options on Windows without forcing shell mode', () => {
    setPlatform('win32')
    spawnClaude(['-p', 'hello'], { encoding: 'utf8', timeout: 60_000, input: '' })
    expect(mockSpawnSync).toHaveBeenCalledWith(
      'claude',
      ['-p', 'hello'],
      expect.objectContaining({ encoding: 'utf8', timeout: 60_000, input: '' })
    )
  })

  it('returns the spawnSync result', () => {
    setPlatform('linux')
    const fakeResult = { status: 0, stdout: 'ok', stderr: '', output: ['', 'ok', ''], pid: 42, signal: null }
    mockSpawnSync.mockReturnValue(fakeResult as never)
    const result = spawnClaude(['-p', 'hello'])
    expect(result).toBe(fakeResult)
  })
})

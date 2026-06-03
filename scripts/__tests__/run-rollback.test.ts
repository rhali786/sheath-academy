/** @jest-environment node */

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}))

jest.mock('@/features/feedback/server/service', () => ({
  rollbackFeedbackAttachedToPr: jest.fn(),
}))

jest.mock('@/features/about/server/repository', () => ({
  deleteChangelogEntryByPrNumber: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { rollbackFeedbackAttachedToPr } from '@/features/feedback/server/service'
import { deleteChangelogEntryByPrNumber } from '@/features/about/server/repository'
import { runRollback } from '../run-rollback'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>
const mockRollbackFeedbackAttachedToPr = rollbackFeedbackAttachedToPr as jest.MockedFunction<typeof rollbackFeedbackAttachedToPr>
const mockDeleteChangelogEntryByPrNumber =
  deleteChangelogEntryByPrNumber as jest.MockedFunction<typeof deleteChangelogEntryByPrNumber>

function makeGhPrJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    number: 42,
    state: 'OPEN',
    baseRefName: 'dev',
    mergedAt: null,
    headRefName: 'enhancement/feedback-steward-20260525-1558',
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockRollbackFeedbackAttachedToPr.mockResolvedValue(undefined)
  mockDeleteChangelogEntryByPrNumber.mockResolvedValue(undefined)
})

describe('runRollback', () => {
  it('closes an open PR and rolls back feedback/changelog metadata', async () => {
    mockSpawnSync
      .mockReturnValueOnce({
        status: 0,
        stdout: makeGhPrJson({ state: 'OPEN' }),
        stderr: '',
        output: ['', makeGhPrJson({ state: 'OPEN' }), ''],
        pid: 100,
        signal: null,
      } as never)
      .mockReturnValueOnce({
        status: 0,
        stdout: '',
        stderr: '',
        output: ['', '', ''],
        pid: 101,
        signal: null,
      } as never)

    await runRollback({ prNumber: 42 })

    expect(mockSpawnSync).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^gh(\.exe)?$/),
      expect.arrayContaining(['pr', 'view', '42']),
      expect.any(Object),
    )
    expect(mockSpawnSync).toHaveBeenNthCalledWith(
      2,
      expect.stringMatching(/^gh(\.exe)?$/),
      ['pr', 'close', '42', '--comment', 'Rolled back by steward:rollback'],
      expect.any(Object),
    )
    expect(mockRollbackFeedbackAttachedToPr).toHaveBeenCalledWith(42)
    expect(mockDeleteChangelogEntryByPrNumber).toHaveBeenCalledWith(42)
  })

  it('skips closing when the PR is already closed but still rolls back metadata', async () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: makeGhPrJson({ state: 'CLOSED' }),
      stderr: '',
      output: ['', makeGhPrJson({ state: 'CLOSED' }), ''],
      pid: 100,
      signal: null,
    } as never)

    await runRollback({ prNumber: 42 })

    expect(mockSpawnSync).toHaveBeenCalledTimes(1)
    expect(mockRollbackFeedbackAttachedToPr).toHaveBeenCalledWith(42)
    expect(mockDeleteChangelogEntryByPrNumber).toHaveBeenCalledWith(42)
  })

  it('rejects merged PRs because code rollback is a different operation', async () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: makeGhPrJson({ state: 'MERGED', mergedAt: '2026-05-25T18:00:00Z' }),
      stderr: '',
      output: ['', makeGhPrJson({ state: 'MERGED', mergedAt: '2026-05-25T18:00:00Z' }), ''],
      pid: 100,
      signal: null,
    } as never)

    await expect(runRollback({ prNumber: 42 })).rejects.toThrow(/already merged/i)

    expect(mockRollbackFeedbackAttachedToPr).not.toHaveBeenCalled()
    expect(mockDeleteChangelogEntryByPrNumber).not.toHaveBeenCalled()
  })

  it('throws when gh PR lookup fails', async () => {
    mockSpawnSync.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'Could not resolve to a PullRequest',
      output: ['', '', 'Could not resolve to a PullRequest'],
      pid: 100,
      signal: null,
    } as never)

    await expect(runRollback({ prNumber: 99 })).rejects.toThrow(/Could not resolve/i)

    expect(mockRollbackFeedbackAttachedToPr).not.toHaveBeenCalled()
    expect(mockDeleteChangelogEntryByPrNumber).not.toHaveBeenCalled()
  })

  it('stops before deleting changelog when feedback rollback fails', async () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: makeGhPrJson({ state: 'CLOSED' }),
      stderr: '',
      output: ['', makeGhPrJson({ state: 'CLOSED' }), ''],
      pid: 100,
      signal: null,
    } as never)
    mockRollbackFeedbackAttachedToPr.mockRejectedValue(
      Object.assign(new Error('no rollbackable rows'), { code: 'no_rollbackable_rows' }),
    )

    await expect(runRollback({ prNumber: 42 })).rejects.toThrow(/no rollbackable rows/i)

    expect(mockDeleteChangelogEntryByPrNumber).not.toHaveBeenCalled()
  })
})

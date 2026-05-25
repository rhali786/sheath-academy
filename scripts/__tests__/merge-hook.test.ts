/** @jest-environment node */

jest.mock('child_process', () => ({
  spawnSync: jest.fn(),
}))

jest.mock('@/features/feedback/server/service', () => ({
  markFeedbackShippedByPr: jest.fn(),
}))

import { spawnSync } from 'child_process'
import { markFeedbackShippedByPr } from '@/features/feedback/server/service'
import { runMergeHook } from '../merge-hook'

const mockSpawnSync = spawnSync as jest.MockedFunction<typeof spawnSync>
const mockMarkFeedbackShippedByPr = markFeedbackShippedByPr as jest.MockedFunction<typeof markFeedbackShippedByPr>

function makeGhPrJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    number: 42,
    state: 'MERGED',
    baseRefName: 'dev',
    mergedAt: '2026-05-25T18:00:00Z',
    headRefName: 'enhancement/feedback-steward-20260525-1558',
    ...overrides,
  })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockMarkFeedbackShippedByPr.mockResolvedValue(undefined)
})

describe('runMergeHook', () => {
  it('marks feedback rows shipped when PR is merged into dev', async () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: makeGhPrJson(),
      stderr: '',
      output: ['', makeGhPrJson(), ''],
      pid: 100,
      signal: null,
    } as never)

    await runMergeHook({ prNumber: 42, versionResolved: '2.1.0', changelogVersion: '2.1.0' })

    expect(mockSpawnSync).toHaveBeenCalledWith(
      expect.stringMatching(/^gh(\.exe)?$/),
      expect.arrayContaining(['pr', 'view', '42']),
      expect.any(Object),
    )
    expect(mockMarkFeedbackShippedByPr).toHaveBeenCalledWith(42, {
      versionResolved: '2.1.0',
      changelogVersion: '2.1.0',
    })
  })

  it('throws when the PR is not merged into dev', async () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: makeGhPrJson({ state: 'OPEN', baseRefName: 'dev' }),
      stderr: '',
      output: ['', makeGhPrJson({ state: 'OPEN' }), ''],
      pid: 100,
      signal: null,
    } as never)

    await expect(runMergeHook({ prNumber: 42, versionResolved: '2.1.0' })).rejects.toThrow(
      /not merged/i
    )

    expect(mockMarkFeedbackShippedByPr).not.toHaveBeenCalled()
  })

  it('throws when the PR is merged into a branch other than dev', async () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: makeGhPrJson({ state: 'MERGED', baseRefName: 'master' }),
      stderr: '',
      output: ['', makeGhPrJson({ state: 'MERGED', baseRefName: 'master' }), ''],
      pid: 100,
      signal: null,
    } as never)

    await expect(runMergeHook({ prNumber: 42, versionResolved: '2.1.0' })).rejects.toThrow(
      /not merged into dev/i
    )

    expect(mockMarkFeedbackShippedByPr).not.toHaveBeenCalled()
  })

  it('throws when gh CLI returns non-zero exit code', async () => {
    mockSpawnSync.mockReturnValue({
      status: 1,
      stdout: '',
      stderr: 'Could not resolve to a PullRequest',
      output: ['', '', 'Could not resolve to a PullRequest'],
      pid: 100,
      signal: null,
    } as never)

    await expect(runMergeHook({ prNumber: 99, versionResolved: '2.1.0' })).rejects.toThrow(
      /Could not resolve/i
    )

    expect(mockMarkFeedbackShippedByPr).not.toHaveBeenCalled()
  })

  it('propagates service error when marking rows shipped fails', async () => {
    mockSpawnSync.mockReturnValue({
      status: 0,
      stdout: makeGhPrJson(),
      stderr: '',
      output: ['', makeGhPrJson(), ''],
      pid: 100,
      signal: null,
    } as never)
    mockMarkFeedbackShippedByPr.mockRejectedValue(
      Object.assign(new Error('no shippable rows'), { code: 'no_shippable_rows' })
    )

    await expect(runMergeHook({ prNumber: 42, versionResolved: '2.1.0' })).rejects.toThrow(
      /no shippable rows/i
    )
  })
})

/** @jest-environment node */

jest.mock('../feedback-requeue', () => ({
  getUnclassifiedFeedback: jest.fn(),
}))

jest.mock('../claude-preflight', () => ({
  runClaudePreflight: jest.fn(),
}))

import { getUnclassifiedFeedback } from '../feedback-requeue'
import { runClaudePreflight } from '../claude-preflight'
import { runStewardPreflight } from '../steward-preflight'

const mockGetUnclassifiedFeedback = getUnclassifiedFeedback as jest.MockedFunction<typeof getUnclassifiedFeedback>
const mockRunClaudePreflight = runClaudePreflight as jest.MockedFunction<typeof runClaudePreflight>

beforeEach(() => {
  jest.clearAllMocks()
  mockRunClaudePreflight.mockReturnValue({
    status: 'ok',
    checkedAt: '2026-05-25T20:00:00.000Z',
    elapsedMs: 850,
    timeoutMs: 30_000,
  })
})

describe('runStewardPreflight', () => {
  it('checks the feedback query path and Claude CLI before steward runs', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([
      {
        id: 'fb_1',
        message: 'Clarify dashboard copy',
        pagePath: '/dashboard',
        sentiment: 'poor',
        createdAt: '2026-05-25T20:00:00.000Z',
        userId: 'user_1',
        userEmail: 'test@example.com',
      },
      {
        id: 'fb_2',
        message: 'Center version label',
        pagePath: '/settings',
        sentiment: 'okay',
        createdAt: '2026-05-25T20:01:00.000Z',
        userId: 'user_1',
        userEmail: 'test@example.com',
      },
    ] as never)

    const result = await runStewardPreflight()

    expect(result.submittedCount).toBe(2)
    expect(result.sampleIds).toEqual(['fb_1', 'fb_2'])
    expect(result.claude.elapsedMs).toBe(850)
    expect(mockGetUnclassifiedFeedback).toHaveBeenCalledTimes(1)
    expect(mockRunClaudePreflight).toHaveBeenCalledTimes(1)
  })

  it('fails before steward work begins when Claude preflight fails', async () => {
    mockGetUnclassifiedFeedback.mockResolvedValue([] as never)
    mockRunClaudePreflight.mockImplementation(() => {
      throw new Error('Claude preflight timed out after 30000ms')
    })

    await expect(runStewardPreflight()).rejects.toThrow(/claude preflight timed out/i)
  })
})

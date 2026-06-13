/** @jest-environment node */

jest.mock('@/features/learning-time/server/repository', () => ({
  createSessionRow: jest.fn(),
  getActiveSessionRow: jest.fn(),
  getSessionRow: jest.fn(),
  listFinalizedSessionRows: jest.fn(),
  updateSessionRow: jest.fn(),
}))

import { getSessionRow, updateSessionRow } from '@/features/learning-time/server/repository'
import {
  InvalidTransitionError,
  SessionNotFoundError,
  transitionSession,
} from '@/features/learning-time/server/service'
import type { LearningTimeSessionRow } from '@/features/learning-time/server/repository'

const mockGetSessionRow = getSessionRow as jest.Mock
const mockUpdateSessionRow = updateSessionRow as jest.Mock

const householdId = 'hh_test'

function baseRow(overrides: Partial<LearningTimeSessionRow> = {}): LearningTimeSessionRow {
  return {
    id: 'lt_1',
    householdId,
    learnerId: 'learner_1',
    subjectId: null,
    lessonTaskId: null,
    timeChannelType: 'stopwatch',
    targetMinutes: null,
    scheduledStart: null,
    scheduledEnd: null,
    status: 'draft',
    startedAt: null,
    pausedAt: null,
    endedAt: null,
    endedBy: null,
    outcome: null,
    notes: null,
    createdAt: new Date('2026-06-12T00:00:00.000Z'),
    updatedAt: new Date('2026-06-12T00:00:00.000Z'),
    ...overrides,
  } as LearningTimeSessionRow
}

let currentRow: LearningTimeSessionRow | null

beforeEach(() => {
  currentRow = null
  mockGetSessionRow.mockReset()
  mockUpdateSessionRow.mockReset()
  mockGetSessionRow.mockImplementation(() => Promise.resolve(currentRow))
  mockUpdateSessionRow.mockImplementation((id: string, hh: string, patch: Partial<LearningTimeSessionRow>) =>
    Promise.resolve({ ...(currentRow as LearningTimeSessionRow), ...patch }),
  )
})

function setCurrentRow(overrides: Partial<LearningTimeSessionRow> = {}): void {
  currentRow = baseRow(overrides)
}

describe('transitionSession', () => {
  it('throws SessionNotFoundError when the session does not exist', async () => {
    currentRow = null
    await expect(transitionSession('missing', householdId, { action: 'start' })).rejects.toThrow(
      SessionNotFoundError,
    )
  })

  describe('start', () => {
    it('rejects when status is not draft', async () => {
      setCurrentRow({ status: 'running' })
      await expect(transitionSession('lt_1', householdId, { action: 'start' })).rejects.toThrow(
        InvalidTransitionError,
      )
    })

    it('transitions draft to running and sets startedAt', async () => {
      setCurrentRow({ status: 'draft' })
      const result = await transitionSession('lt_1', householdId, { action: 'start' })
      expect(result.status).toBe('running')
      expect(result.startedAt).toBeTruthy()
      expect(mockUpdateSessionRow).toHaveBeenCalledWith(
        'lt_1',
        householdId,
        expect.objectContaining({ status: 'running', startedAt: expect.any(Date) }),
      )
    })
  })

  describe('pause', () => {
    it('rejects when status is not running', async () => {
      setCurrentRow({ status: 'draft' })
      await expect(transitionSession('lt_1', householdId, { action: 'pause' })).rejects.toThrow(
        InvalidTransitionError,
      )
    })

    it('rejects for scheduled channel type', async () => {
      setCurrentRow({ status: 'running', timeChannelType: 'scheduled', startedAt: new Date() })
      await expect(transitionSession('lt_1', householdId, { action: 'pause' })).rejects.toThrow(
        InvalidTransitionError,
      )
    })

    it('transitions running to paused for stopwatch/timer', async () => {
      setCurrentRow({ status: 'running', timeChannelType: 'stopwatch', startedAt: new Date() })
      const result = await transitionSession('lt_1', householdId, { action: 'pause' })
      expect(result.status).toBe('paused')
      expect(mockUpdateSessionRow).toHaveBeenCalledWith(
        'lt_1',
        householdId,
        expect.objectContaining({ status: 'paused', pausedAt: expect.any(Date) }),
      )
    })
  })

  describe('resume', () => {
    it('rejects when status is not paused', async () => {
      setCurrentRow({ status: 'running' })
      await expect(transitionSession('lt_1', householdId, { action: 'resume' })).rejects.toThrow(
        InvalidTransitionError,
      )
    })

    it('rejects for scheduled channel type', async () => {
      setCurrentRow({
        status: 'paused',
        timeChannelType: 'scheduled',
        startedAt: new Date(),
        pausedAt: new Date(),
      })
      await expect(transitionSession('lt_1', householdId, { action: 'resume' })).rejects.toThrow(
        InvalidTransitionError,
      )
    })

    it('transitions paused to running and clears pausedAt', async () => {
      setCurrentRow({
        status: 'paused',
        timeChannelType: 'timer',
        targetMinutes: 20,
        startedAt: new Date(),
        pausedAt: new Date(),
      })
      const result = await transitionSession('lt_1', householdId, { action: 'resume' })
      expect(result.status).toBe('running')
      expect(mockUpdateSessionRow).toHaveBeenCalledWith(
        'lt_1',
        householdId,
        expect.objectContaining({ status: 'running', pausedAt: null }),
      )
    })
  })

  describe('end', () => {
    it('rejects when status is draft', async () => {
      setCurrentRow({ status: 'draft' })
      await expect(transitionSession('lt_1', householdId, { action: 'end' })).rejects.toThrow(
        InvalidTransitionError,
      )
    })

    it('computes endedBy "time" for a timer session past its target', async () => {
      const startedAt = new Date(Date.now() - 30 * 60 * 1000)
      setCurrentRow({ status: 'running', timeChannelType: 'timer', targetMinutes: 20, startedAt })
      const result = await transitionSession('lt_1', householdId, { action: 'end' })
      expect(result.status).toBe('ended')
      expect(result.endedBy).toBe('time')
      expect(result.elapsedSeconds).toBeGreaterThanOrEqual(30 * 60 - 1)
      expect(mockUpdateSessionRow).toHaveBeenCalledWith(
        'lt_1',
        householdId,
        expect.objectContaining({ status: 'ended', endedBy: 'time', endedAt: expect.any(Date) }),
      )
    })

    it('computes endedBy "manual" for a timer session ended before its target', async () => {
      const startedAt = new Date(Date.now() - 5 * 60 * 1000)
      setCurrentRow({ status: 'running', timeChannelType: 'timer', targetMinutes: 20, startedAt })
      const result = await transitionSession('lt_1', householdId, { action: 'end' })
      expect(result.endedBy).toBe('manual')
    })

    it('computes endedBy "manual" for a stopwatch session', async () => {
      const startedAt = new Date(Date.now() - 10 * 60 * 1000)
      setCurrentRow({ status: 'running', timeChannelType: 'stopwatch', startedAt })
      const result = await transitionSession('lt_1', householdId, { action: 'end' })
      expect(result.endedBy).toBe('manual')
    })

    it('allows ending a paused session', async () => {
      const startedAt = new Date(Date.now() - 10 * 60 * 1000)
      setCurrentRow({ status: 'paused', timeChannelType: 'stopwatch', startedAt, pausedAt: new Date() })
      const result = await transitionSession('lt_1', householdId, { action: 'end' })
      expect(result.status).toBe('ended')
    })
  })

  describe('finalize', () => {
    it('rejects when status is not ended', async () => {
      setCurrentRow({ status: 'running' })
      await expect(
        transitionSession('lt_1', householdId, { action: 'finalize', outcome: 'complete' }),
      ).rejects.toThrow(InvalidTransitionError)
    })

    it('transitions ended to finalized with outcome and notes', async () => {
      setCurrentRow({ status: 'ended', startedAt: new Date(Date.now() - 600000), endedAt: new Date() })
      const result = await transitionSession('lt_1', householdId, {
        action: 'finalize',
        outcome: 'complete',
        notes: 'Great session',
      })
      expect(result.status).toBe('finalized')
      expect(result.outcome).toBe('complete')
      expect(mockUpdateSessionRow).toHaveBeenCalledWith(
        'lt_1',
        householdId,
        expect.objectContaining({ status: 'finalized', outcome: 'complete', notes: 'Great session' }),
      )
    })
  })
})

import {
  createSessionRow,
  getActiveSessionRow,
  getSessionRow,
  listFinalizedSessionRows,
  updateSessionRow,
  type LearningTimeSessionRow,
} from './repository'
import type {
  CreateSessionInput,
  EndedBy,
  LearningTimeSession,
  Outcome,
  SessionListFilters,
  SessionStatus,
  SessionTransitionInput,
  TimeChannelType,
} from '../types'

export class SessionNotFoundError extends Error {}
export class InvalidTransitionError extends Error {}

/**
 * Wall-clock elapsed time from startedAt to the session's reference end point
 * (endedAt if ended/finalized, pausedAt if currently paused, otherwise now).
 * A resumed session's elapsed time includes any time spent paused — Phase 1
 * tracks a single pause/resume cycle and does not accumulate active-time only.
 */
function computeElapsedSeconds(row: LearningTimeSessionRow, now: Date): number {
  if (!row.startedAt) return 0
  const reference = row.endedAt ?? (row.status === 'paused' ? row.pausedAt : null) ?? now
  return Math.max(0, Math.floor((reference.getTime() - row.startedAt.getTime()) / 1000))
}

/** 'time' if the session's target (timer minutes or scheduled end) has been reached, else 'manual'. */
function computeEndedBy(row: LearningTimeSessionRow, now: Date): EndedBy {
  if (row.timeChannelType === 'timer' && row.targetMinutes != null && row.startedAt) {
    const elapsed = computeElapsedSeconds({ ...row, endedAt: now }, now)
    return elapsed >= row.targetMinutes * 60 ? 'time' : 'manual'
  }
  if (row.timeChannelType === 'scheduled' && row.scheduledEnd) {
    return now.getTime() >= row.scheduledEnd.getTime() ? 'time' : 'manual'
  }
  return 'manual'
}

function toDomain(row: LearningTimeSessionRow, now: Date = new Date()): LearningTimeSession {
  return {
    id: row.id,
    householdId: row.householdId,
    learnerId: row.learnerId,
    subjectId: row.subjectId,
    lessonTaskId: row.lessonTaskId,
    timeChannelType: row.timeChannelType as TimeChannelType,
    targetMinutes: row.targetMinutes,
    scheduledStart: row.scheduledStart?.toISOString() ?? null,
    scheduledEnd: row.scheduledEnd?.toISOString() ?? null,
    status: row.status as SessionStatus,
    startedAt: row.startedAt?.toISOString() ?? null,
    pausedAt: row.pausedAt?.toISOString() ?? null,
    endedAt: row.endedAt?.toISOString() ?? null,
    endedBy: row.endedBy as EndedBy | null,
    outcome: row.outcome as Outcome | null,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    elapsedSeconds: computeElapsedSeconds(row, now),
  }
}

export async function createSession(
  householdId: string,
  input: CreateSessionInput,
): Promise<LearningTimeSession> {
  const row = await createSessionRow(householdId, {
    learnerId: input.learnerId,
    subjectId: input.subjectId ?? null,
    lessonTaskId: input.lessonTaskId ?? null,
    timeChannelType: input.timeChannelType,
    targetMinutes: input.targetMinutes ?? null,
    scheduledStart: input.scheduledStart ? new Date(input.scheduledStart) : null,
    scheduledEnd: input.scheduledEnd ? new Date(input.scheduledEnd) : null,
  })
  return toDomain(row)
}

export async function getActiveSession(
  householdId: string,
  learnerId: string,
): Promise<LearningTimeSession | null> {
  const row = await getActiveSessionRow(householdId, learnerId)
  return row ? toDomain(row) : null
}

export async function listSessions(
  householdId: string,
  filters: SessionListFilters = {},
): Promise<LearningTimeSession[]> {
  const rows = await listFinalizedSessionRows(householdId, filters)
  return rows.map(row => toDomain(row))
}

/** Validates and applies a lifecycle transition, computing endedBy/elapsed time server-side. */
export async function transitionSession(
  id: string,
  householdId: string,
  input: SessionTransitionInput,
): Promise<LearningTimeSession> {
  const row = await getSessionRow(id, householdId)
  if (!row) throw new SessionNotFoundError(`Session ${id} not found`)

  const now = new Date()

  switch (input.action) {
    case 'start': {
      if (row.status !== 'draft') {
        throw new InvalidTransitionError('Session must be in draft status to start')
      }
      const updated = await updateSessionRow(id, householdId, { status: 'running', startedAt: now })
      return toDomain(updated!, now)
    }
    case 'pause': {
      if (row.status !== 'running') {
        throw new InvalidTransitionError('Session must be running to pause')
      }
      if (row.timeChannelType === 'scheduled') {
        throw new InvalidTransitionError('Scheduled sessions cannot be paused')
      }
      const updated = await updateSessionRow(id, householdId, { status: 'paused', pausedAt: now })
      return toDomain(updated!, now)
    }
    case 'resume': {
      if (row.status !== 'paused') {
        throw new InvalidTransitionError('Session must be paused to resume')
      }
      if (row.timeChannelType === 'scheduled') {
        throw new InvalidTransitionError('Scheduled sessions cannot be resumed')
      }
      const updated = await updateSessionRow(id, householdId, { status: 'running', pausedAt: null })
      return toDomain(updated!, now)
    }
    case 'end': {
      if (row.status !== 'running' && row.status !== 'paused') {
        throw new InvalidTransitionError('Session must be running or paused to end')
      }
      const endedBy = computeEndedBy(row, now)
      const updated = await updateSessionRow(id, householdId, { status: 'ended', endedAt: now, endedBy })
      return toDomain(updated!, now)
    }
    case 'finalize': {
      if (row.status !== 'ended') {
        throw new InvalidTransitionError('Session must be ended to finalize')
      }
      const updated = await updateSessionRow(id, householdId, {
        status: 'finalized',
        outcome: input.outcome ?? null,
        notes: input.notes ?? row.notes,
      })
      return toDomain(updated!, now)
    }
    default:
      throw new InvalidTransitionError(`Unknown action: ${input.action}`)
  }
}
